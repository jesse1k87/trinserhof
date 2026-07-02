import * as React from 'react';
import {
  getSupabaseClient,
  type Price as PriceRow,
  type Occupancy as OccupancyRow,
} from '@trinserhof/supabase';

// A single dated `Price` row's amounts, keyed by `${roomTypeId}|${date}`.
export type PriceCell = { base: number; markup: number };

// Hotel-wide occupancy for a single date: the guests staying that day and the
// total capacity, both summed across every room type's `Occupancy` row for
// that date. The percentage is derived from these (occupancy / maxGuests).
export type OccupancyCell = { occupancy: number; maxGuests: number };

export type PricingGridData = {
  // Dated price rows, keyed by `${roomTypeId}|${date}` (YYYY-MM-DD).
  priceByKey: Map<string, PriceCell>;
  // Aggregated occupancy per date (occupancy is stored per room type + date,
  // but the grid shows one occupancy row for the whole hotel each day).
  occupancyByDate: Map<string, OccupancyCell>;
  loading: boolean;
};

export const priceKey = (roomTypeId: string, date: string): string => `${roomTypeId}|${date}`;

const usePricingGrid = (): PricingGridData => {
  const [data, setData] = React.useState<Omit<PricingGridData, 'loading'>>({
    priceByKey: new Map(),
    occupancyByDate: new Map(),
  });
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let active = true;

    Promise.all([
      Promise.resolve(getSupabaseClient().from('Price').select('*').not('date', 'is', null)),
      Promise.resolve(getSupabaseClient().from('Occupancy').select('*')),
    ])
      .then(
        ([{ data: priceRows, error: priceError }, { data: occupancyRows, error: occupancyError }]: [
          { data: PriceRow[] | null; error: unknown },
          { data: OccupancyRow[] | null; error: unknown },
        ]) => {
          if (priceError) throw priceError;
          if (occupancyError) throw occupancyError;
          if (!active) return;

          const priceByKey = new Map<string, PriceCell>();
          for (const row of priceRows ?? []) {
            if (!row.date) continue;
            priceByKey.set(priceKey(row.roomTypeId, row.date), {
              base: row.base,
              markup: row.markup,
            });
          }

          // Sum both the guests staying and the total capacity per date across
          // every room type, so the grid can show a true hotel-wide occupancy %.
          const occupancyByDate = new Map<string, OccupancyCell>();
          for (const row of occupancyRows ?? []) {
            if (!row.date) continue;
            const occupancy = Number(row.occupancy);
            const maxGuests = Number(row.maxGuests);
            if (Number.isNaN(occupancy) || Number.isNaN(maxGuests)) continue;
            const entry = occupancyByDate.get(row.date) ?? { occupancy: 0, maxGuests: 0 };
            entry.occupancy += occupancy;
            entry.maxGuests += maxGuests;
            occupancyByDate.set(row.date, entry);
          }

          setData({ priceByKey, occupancyByDate });
        },
      )
      .catch((error: unknown) => {
        console.error(error);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return { ...data, loading };
};

export default usePricingGrid;
