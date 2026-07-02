import * as React from 'react';
import {
  getSupabaseClient,
  type Price as PriceRow,
  type RoomType as RoomTypeRow,
} from '@trinserhof/supabase';
import { EMPTY_PRICES, Prices, RoomTypePriceMap } from '@trinserhof/types';

// The base price per night now lives on the `RoomType` row itself
// (`RoomType.basePrice`) rather than as a null-date row in `Price` - only
// per-night overrides (rows with a `date`) still come from the `Price` table.
const toPrices = (roomTypes: RoomTypeRow[], overrideRows: PriceRow[]): Prices => {
  const base: RoomTypePriceMap = {};
  for (const roomType of roomTypes) {
    base[roomType.id] = roomType.basePrice;
  }

  const overrides: Record<string, RoomTypePriceMap> = {};
  for (const row of overrideRows) {
    if (!row.date) continue;
    overrides[row.date] = { ...overrides[row.date], [row.roomTypeId]: row.base };
  }

  return { base, overrides };
};

const usePrices = (): Prices => {
  const [prices, setPrices] = React.useState<Prices>(EMPTY_PRICES);

  React.useEffect(() => {
    let active = true;

    Promise.all([
      Promise.resolve(getSupabaseClient().from('RoomType').select('*')),
      Promise.resolve(getSupabaseClient().from('Price').select('*').not('date', 'is', null)),
    ])
      .then(
        ([
          { data: roomTypes, error: roomTypesError },
          { data: overrideRows, error: overridesError },
        ]: [
          { data: RoomTypeRow[] | null; error: unknown },
          { data: PriceRow[] | null; error: unknown },
        ]) => {
          if (roomTypesError) throw roomTypesError;
          if (overridesError) throw overridesError;
          if (active) {
            setPrices(toPrices(roomTypes ?? [], overrideRows ?? []));
          }
        },
      )
      .catch((error: unknown) => {
        console.error(error);
      });

    return () => {
      active = false;
    };
  }, []);

  return prices;
};

export default usePrices;
