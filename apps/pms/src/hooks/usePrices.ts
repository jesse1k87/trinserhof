import * as React from 'react';
import { getDb, type Price as PriceRow } from '@trinserhof/supabase';
import { EMPTY_PRICES, Prices, RoomTypePriceMap } from '@trinserhof/types';

const toPrices = (rows: PriceRow[]): Prices => {
  const base: RoomTypePriceMap = {};
  const overrides: Record<string, RoomTypePriceMap> = {};

  for (const row of rows) {
    if (row.date) {
      const night = row.date.toISOString().slice(0, 10);
      overrides[night] = { ...overrides[night], [row.roomTypeId]: row.amount };
    } else {
      base[row.roomTypeId] = row.amount;
    }
  }

  return { base, overrides };
};

const usePrices = (): Prices => {
  const [prices, setPrices] = React.useState<Prices>(EMPTY_PRICES);

  React.useEffect(() => {
    let active = true;

    getDb()
      .price.findMany()
      .then((rows: PriceRow[]) => {
        if (active) {
          setPrices(toPrices(rows));
        }
      })
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
