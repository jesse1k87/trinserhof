import * as React from 'react';
import { getDb, type AccountingCategory as AccountingCategoryRow } from '@trinserhof/supabase';
import { AccountingCategory, TaxRate } from '@trinserhof/types';

const toAccountingCategory = (row: AccountingCategoryRow): AccountingCategory => ({
  id: row.id,
  name: row.name,
  taxRate: row.taxRate as TaxRate,
  ledgerCode: row.ledgerCode,
  color: row.color,
});

const useAccountingCategories = () => {
  const [categories, setCategories] = React.useState<AccountingCategory[]>([]);

  React.useEffect(() => {
    let active = true;

    getDb()
      .accountingCategory.findMany()
      .then((rows: AccountingCategoryRow[]) => {
        if (active) {
          setCategories(rows.map(toAccountingCategory));
        }
      })
      .catch((error: unknown) => {
        console.error(error);
      });

    return () => {
      active = false;
    };
  }, []);

  return categories;
};

export default useAccountingCategories;
