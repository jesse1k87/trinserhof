import * as React from 'react';
import {
  getSupabaseClient,
  type AccountingCategory as AccountingCategoryRow,
} from '@trinserhof/supabase';
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

    getSupabaseClient()
      .from('AccountingCategory')
      .select('*')
      .then(({ data, error }: { data: AccountingCategoryRow[] | null; error: unknown }) => {
        if (error) throw error;
        if (active) {
          setCategories((data ?? []).map(toAccountingCategory));
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
