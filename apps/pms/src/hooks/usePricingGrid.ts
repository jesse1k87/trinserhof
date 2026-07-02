import * as React from 'react';
import {
  getSupabaseClient,
  type Price as PriceRow,
  type RoomTypeOccupancy as OccupancyRow,
} from '@trinserhof/supabase';

// A single dated `Price` row's amounts, keyed by `${roomTypeId}|${date}`.
export type PriceCell = { base: number; markup: number };

export type PricingGridData = {
  // Dated price rows, keyed by `${roomTypeId}|${date}` (YYYY-MM-DD).
  priceByKey: Map<string, PriceCell>;
  // A single occupancy percentage per date, averaged across the room types
  // that have a `RoomTypeOccupancy` row for that date (occupancy is stored per
  // room type + date, but the grid shows one occupancy row for the whole day).
  occupancyByDate: Map<string, number>;
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
      Promise.resolve(getSupabaseClient().from('RoomTypeOccupancy').select('*')),
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

          // Sum occupancy per date, then average across the room types present.
          const sums = new Map<string, { total: number; count: number }>();
          for (const row of occupancyRows ?? []) {
            if (!row.date) continue;
            const value = Number(row.occupancy);
            if (Number.isNaN(value)) continue;
            const entry = sums.get(row.date) ?? { total: 0, count: 0 };
            entry.total += value;
            entry.count += 1;
            sums.set(row.date, entry);
          }
          const occupancyByDate = new Map<string, number>();
          for (const [date, { total, count }] of sums) {
            occupancyByDate.set(date, total / count);
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
