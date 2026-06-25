import * as React from 'react';
import { onValue, ref } from 'firebase/database';
import { getDb } from '@trinserhof/database';
import { EMPTY_PRICES, Prices } from '@trinserhof/types';

const usePrices = (): Prices => {
  const [prices, setPrices] = React.useState<Prices>(EMPTY_PRICES);

  const db = getDb();

  React.useEffect(() => {
    const unsubscribe = onValue(
      ref(db, 'prices'),
      (snapshot) => {
        const value = snapshot.val() ?? {};
        setPrices({ base: value.base ?? {}, overrides: value.overrides ?? {} });
      },
      (error) => {
        console.error(error);
      },
    );

    return () => unsubscribe();
  }, [db]);

  return prices;
};

export default usePrices;
