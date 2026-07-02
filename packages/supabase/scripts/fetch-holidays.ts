/**
 * Sync public and school holidays from the OpenHolidays API into the Supabase
 * (Postgres) `Region` / `Holiday` tables.
 *
 * OpenHolidays (https://www.openholidaysapi.org) is a free, open, no-auth REST
 * API for public and school holidays across (mostly European) countries. We use
 * three of its endpoints:
 *   - GET /Subdivisions?countryIsoCode=XX  – the country's subdivisions
 *     (e.g. Austrian Bundesländer), each with an ISO 3166-2 `code` and a
 *     localized `name`.
 *   - GET /PublicHolidays?countryIsoCode=XX&validFrom=…&validTo=…
 *   - GET /SchoolHolidays?countryIsoCode=XX&validFrom=…&validTo=…
 *     Each holiday has a `type`, localized `name`, `startDate`/`endDate`
 *     (YYYY-MM-DD), a `nationwide` flag, and (when not nationwide) the list of
 *     `subdivisions` it applies to.
 *
 * Data model (see prisma/schema.prisma):
 *   - Each country gets a synthetic country-level `Region` (id = country code,
 *     e.g. "AT") that owns that country's nationwide holidays, plus one `Region`
 *     per subdivision (id = subdivision code, e.g. "AT-7").
 *   - Every holiday becomes one or more `Holiday` rows: nationwide holidays are
 *     stored once against the country-level region; subdivision-specific
 *     holidays are stored once per subdivision they apply to.
 *
 * The sync is idempotent: `Region` rows are upserted (never deleted), and for
 * each country the `Holiday` rows inside the requested date range are replaced
 * (deleted then re-inserted) so corrections and removals in the source
 * propagate. Holidays outside the requested range are left untouched.
 *
 * Configuration (env vars or CLI flags; flags win):
 *   HOLIDAY_COUNTRIES / --countries   Comma-separated ISO 3166-1 codes. Default "AT".
 *   HOLIDAY_LANGUAGE  / --language     ISO language for names. Default "DE".
 *   HOLIDAY_FROM      / --from         Start date YYYY-MM-DD. Default Jan 1 of this year.
 *   HOLIDAY_TO        / --to           End date YYYY-MM-DD. Default Dec 31 of this year + HOLIDAY_YEARS_AHEAD.
 *   HOLIDAY_YEARS_AHEAD / --years-ahead  Extra full years past this one to fetch. Default 2.
 *   --dry-run                          Fetch and log, but write nothing.
 *
 * Usage:
 *   npm run fetch-holidays -w @trinserhof/supabase
 *   tsx scripts/fetch-holidays.ts --countries AT,DE --years-ahead 3 --dry-run
 */
import { PrismaClient } from '@prisma/client';

const API_BASE = 'https://openholidaysapi.org';

// ---- Shapes returned by the OpenHolidays API (only the fields we use) --------

type LocalizedText = { language: string; text: string };

type ApiSubdivision = {
  code: string;
  isoCode?: string;
  shortName: string;
  name: LocalizedText[];
  children?: ApiSubdivision[];
};

type ApiHoliday = {
  id: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  type: string; // "Public" | "School" | "Bank" | "Optional" | …
  name: LocalizedText[];
  nationwide: boolean;
  subdivisions?: { code: string; shortName: string }[];
};

// ---- Config -----------------------------------------------------------------

type Config = {
  countries: string[];
  language: string;
  from: string;
  to: string;
  dryRun: boolean;
};

const argv = process.argv.slice(2);

/** Read a `--flag value` (or `--flag=value`) style CLI argument. */
const flag = (name: string): string | undefined => {
  const eq = argv.find((a) => a.startsWith(`--${name}=`));
  if (eq) return eq.slice(name.length + 3);
  const i = argv.indexOf(`--${name}`);
  if (i !== -1 && argv[i + 1] && !argv[i + 1].startsWith('--')) return argv[i + 1];
  return undefined;
};

const readConfig = (): Config => {
  const now = new Date();
  const thisYear = now.getUTCFullYear();
  const yearsAhead = Number(flag('years-ahead') ?? process.env.HOLIDAY_YEARS_AHEAD ?? '2');

  const countriesRaw = flag('countries') ?? process.env.HOLIDAY_COUNTRIES ?? 'AT';
  const countries = countriesRaw
    .split(',')
    .map((c) => c.trim().toUpperCase())
    .filter(Boolean);

  const from = flag('from') ?? process.env.HOLIDAY_FROM ?? `${thisYear}-01-01`;
  const to =
    flag('to') ??
    process.env.HOLIDAY_TO ??
    `${thisYear + (Number.isFinite(yearsAhead) ? yearsAhead : 2)}-12-31`;

  return {
    countries,
    language: (flag('language') ?? process.env.HOLIDAY_LANGUAGE ?? 'DE').toUpperCase(),
    from,
    to,
    dryRun: argv.includes('--dry-run'),
  };
};

// ---- API access -------------------------------------------------------------

const apiGet = async <T>(path: string, params: Record<string, string>): Promise<T> => {
  const url = new URL(`${API_BASE}${path}`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);

  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) {
    throw new Error(`OpenHolidays API ${path} failed: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as T;
};

/** Pick the requested-language text, falling back to EN then the first entry. */
const localized = (texts: LocalizedText[], language: string): string => {
  const match =
    texts.find((t) => t.language?.toUpperCase() === language) ??
    texts.find((t) => t.language?.toUpperCase() === 'EN') ??
    texts[0];
  return match?.text ?? '';
};

/** Flatten a subdivision tree (subdivisions can nest via `children`). */
const flattenSubdivisions = (subdivisions: ApiSubdivision[]): ApiSubdivision[] =>
  subdivisions.flatMap((s) => [s, ...flattenSubdivisions(s.children ?? [])]);

// ---- Sync -------------------------------------------------------------------

const prisma = new PrismaClient();

const syncCountry = async (country: string, config: Config) => {
  console.log(`\n== ${country} (${config.from} → ${config.to}) ==`);

  // 1. Regions: the synthetic country-level region + one per subdivision.
  const subdivisions = flattenSubdivisions(
    await apiGet<ApiSubdivision[]>('/Subdivisions', {
      countryIsoCode: country,
      languageIsoCode: config.language,
    }),
  );

  const regions = [
    { id: country, countryIsoCode: country, name: country, shortName: country },
    ...subdivisions.map((s) => ({
      id: s.code,
      countryIsoCode: country,
      name: localized(s.name, config.language) || s.code,
      shortName: s.shortName ?? s.code,
    })),
  ];
  const knownRegionIds = new Set(regions.map((r) => r.id));

  // 2. Holidays for the date range (public + school).
  const holidays = (
    await Promise.all(
      ['/PublicHolidays', '/SchoolHolidays'].map((path) =>
        apiGet<ApiHoliday[]>(path, {
          countryIsoCode: country,
          languageIsoCode: config.language,
          validFrom: config.from,
          validTo: config.to,
        }),
      ),
    )
  ).flat();

  // 3. Expand each holiday to one row per region it applies to.
  const rows: {
    regionId: string;
    name: string;
    type: string;
    nationwide: boolean;
    startDate: Date;
    endDate: Date;
  }[] = [];

  for (const h of holidays) {
    const name = localized(h.name, config.language);
    const base = {
      name,
      type: h.type,
      nationwide: h.nationwide,
      startDate: new Date(`${h.startDate}T00:00:00Z`),
      endDate: new Date(`${h.endDate}T00:00:00Z`),
    };

    const regionIds = h.nationwide
      ? [country]
      : (h.subdivisions ?? []).map((s) => s.code).filter((code) => knownRegionIds.has(code));

    for (const regionId of regionIds) rows.push({ regionId, ...base });
  }

  console.log(
    `  fetched ${subdivisions.length} subdivisions, ${holidays.length} holidays → ${rows.length} region rows`,
  );

  if (config.dryRun) {
    console.log('  --dry-run: no writes');
    return;
  }

  // 4. Upsert regions, then replace holidays inside the range for this country.
  for (const region of regions) {
    await prisma.region.upsert({
      where: { id: region.id },
      create: region,
      update: {
        countryIsoCode: region.countryIsoCode,
        name: region.name,
        shortName: region.shortName,
      },
    });
  }

  const deleted = await prisma.holiday.deleteMany({
    where: {
      region: { countryIsoCode: country },
      startDate: {
        gte: new Date(`${config.from}T00:00:00Z`),
        lte: new Date(`${config.to}T00:00:00Z`),
      },
    },
  });

  // De-dupe against the @@unique([regionId, type, startDate, endDate, name]) key
  // in case the source lists a holiday more than once for the same region.
  const seen = new Set<string>();
  const unique = rows.filter((r) => {
    const key = `${r.regionId}|${r.type}|${r.startDate.toISOString()}|${r.endDate.toISOString()}|${r.name}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const { count } = await prisma.holiday.createMany({ data: unique });
  console.log(
    `  upserted ${regions.length} regions, replaced ${deleted.count} → ${count} holidays`,
  );
};

const main = async () => {
  const config = readConfig();
  console.log(
    `Fetching holidays for ${config.countries.join(', ')} in ${config.language}${config.dryRun ? ' (dry run)' : ''}`,
  );

  for (const country of config.countries) {
    await syncCountry(country, config);
  }

  console.log('\nDone.');
};

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
