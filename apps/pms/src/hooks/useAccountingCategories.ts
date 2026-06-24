import * as React from 'react';
import { onValue, ref } from 'firebase/database';
import { getDb } from '@trinserhof/database';
import { AccountingCategory } from '@trinserhof/types';

const useAccountingCategories = () => {
  const [categories, setCategories] = React.useState<AccountingCategory[]>([]);

  const db = getDb();

  React.useEffect(() => {
    const unsubscribe = onValue(
      ref(db, 'accountingCategories'),
      (snapshot) => {
        const documents = snapshot.val() ?? {};
        const docsAsArray: AccountingCategory[] = Object.keys(documents).map((id) => documents[id]);

        setCategories(docsAsArray);
      },
      (error) => {
        console.error(error);
      },
    );

    return () => unsubscribe();
  }, [db]);

  return categories;
};

export default useAccountingCategories;
