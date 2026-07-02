import * as React from 'react';
import { NoAccess, OccupancyPricingIcon, PageHeader, Section, Spinner } from '@trinserhof/ui';
import { canPerform, DEFAULT_LOCALE, type Locale, type User } from '@trinserhof/types';
import { formatCurrency, getYYYYmmDD } from '@trinserhof/helpers';
import usePricingGrid, { priceKey } from 'src/hooks/usePricingGrid';
import useRoomTypes from 'src/hooks/useRoomTypes';

const EM_DASH = '—';

// The visible window: four weeks before today through four weeks after
// (inclusive). This is fixed for now — a later change will let the user pick the
// range through the UI (see the task), so the window is derived here in one place.
const WEEKS_BEFORE = 4;
const WEEKS_AFTER = 4;

const buildDateWindow = (): string[] => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - WEEKS_BEFORE * 7);
  const totalDays = (WEEKS_BEFORE + WEEKS_AFTER) * 7 + 1;
  const dates: string[] = [];
  for (let i = 0; i < totalDays; i++) {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    dates.push(getYYYYmmDD(day));
  }
  return dates;
};

const formatOccupancy = (value: number, locale: Locale): string =>
  `${value.toLocaleString(locale, { maximumFractionDigits: 1 })} %`;

const DateHeader = ({ date, locale }: { date: string; locale: Locale }) => {
  const day = new Date(date);
  return (
    <div className="flex flex-col items-center leading-tight">
      <span className="text-[0.7rem] uppercase text-base-content/50">
        {day.toLocaleDateString(locale, { weekday: 'short' })}
      </span>
      <span className="font-medium">
        {day.toLocaleDateString(locale, { day: '2-digit', month: '2-digit' })}
      </span>
    </div>
  );
};

// The metric labels are shown once, stacked in the sticky first column next to
// the row's name, instead of being repeated inside every date cell.
const MetricLabels = ({ labels }: { labels: string[] }) => (
  <div className="mt-1 flex flex-col gap-0.5">
    {labels.map((label) => (
      <span
        key={label}
        className="text-[0.65rem] uppercase tracking-wide text-base-content/50"
      >
        {label}
      </span>
    ))}
  </div>
);

// The per-date values, stacked to line up with the labels in the first column.
const MetricValues = ({ values }: { values: string[] }) => (
  <div className="flex flex-col gap-0.5 text-left tabular-nums">
    {values.map((value, index) => (
      <span key={index}>{value}</span>
    ))}
  </div>
);

export const OccupancyPricingGrid = ({ user }: { user: User }) => {
  const locale = user.locale ?? DEFAULT_LOCALE;
  const roomTypes = useRoomTypes();
  const { priceByKey, occupancyByDate, loading } = usePricingGrid();

  const dates = React.useMemo(buildDateWindow, []);
  const today = React.useMemo(() => getYYYYmmDD(new Date()), []);

  if (!canPerform(user.role, 'PAGE_OCCUPANCY_PRICING', 'READ')) {
    return <NoAccess />;
  }

  // Sticky first column + a highlighted "today" column. Shared class helpers keep
  // the header cells and body cells aligned.
  const stickyCol = 'sticky left-0 z-20 bg-base-100 border-r border-base-300';
  const dateColClass = (date: string) =>
    `min-w-28 px-3 py-2 text-center align-top border-l border-base-200 ${
      date === today ? 'bg-primary/10' : ''
    }`;

  return (
    <div className="flex w-full flex-col gap-4 px-4 py-6">
      <PageHeader icon={<OccupancyPricingIcon className="size-5" />} title="Occupancy & pricing" />

      <Section className="p-0 overflow-hidden">
        {loading ? (
          <div className="flex justify-center p-8">
            <Spinner />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-max border-collapse text-sm">
              <thead>
                <tr>
                  <th className={`${stickyCol} z-30 px-3 py-2 text-left font-semibold min-w-40`}>
                    Room type
                  </th>
                  {dates.map((date) => (
                    <th key={date} className={`${dateColClass(date)} font-normal`}>
                      <DateHeader date={date} locale={locale} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-base-300 bg-base-200/40">
                  <td className={`${stickyCol} bg-base-200/40 px-3 py-2 align-top font-medium`}>
                    <div>Occupancy</div>
                    <MetricLabels labels={['Guests', '%']} />
                  </td>
                  {dates.map((date) => {
                    const occupancy = occupancyByDate.get(date);
                    const percent =
                      occupancy && occupancy.maxGuests > 0
                        ? (occupancy.occupancy / occupancy.maxGuests) * 100
                        : undefined;
                    return (
                      <td key={date} className={dateColClass(date)}>
                        <MetricValues
                          values={[
                            occupancy
                              ? occupancy.occupancy.toLocaleString(locale)
                              : EM_DASH,
                            percent === undefined ? EM_DASH : formatOccupancy(percent, locale),
                          ]}
                        />
                      </td>
                    );
                  })}
                </tr>

                {roomTypes.map((roomType) => (
                  <tr key={roomType.id} className="border-t border-base-300">
                    <td className={`${stickyCol} px-3 py-2 align-top`}>
                      <div className="font-medium">{roomType.label}</div>
                      <div className="font-mono text-[0.7rem] text-base-content/50">
                        {roomType.id}
                      </div>
                      <MetricLabels labels={['Base price', 'Base', 'Markup']} />
                    </td>
                    {dates.map((date) => {
                      const cell = priceByKey.get(priceKey(roomType.id, date));
                      return (
                        <td key={date} className={dateColClass(date)}>
                          <MetricValues
                            values={[
                              roomType.basePrice === null || roomType.basePrice === undefined
                                ? EM_DASH
                                : formatCurrency(roomType.basePrice, 2, locale),
                              cell ? formatCurrency(cell.base, 2, locale) : EM_DASH,
                              cell ? formatCurrency(cell.markup, 2, locale) : EM_DASH,
                            ]}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </div>
  );
};
