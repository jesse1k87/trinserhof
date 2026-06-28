import * as React from 'react';
import { getSupabaseClient, type Product as ProductRow } from '@trinserhof/supabase';
import { Product, ProductVariant } from '@trinserhof/types';

const toProduct = (row: ProductRow): Product => ({
  id: row.id,
  name: row.name,
  price: row.price,
  accountingCategoryId: row.accountingCategoryId,
  variants: (row.variants as unknown as ProductVariant[] | null) ?? undefined,
});

const useProducts = () => {
  const [products, setProducts] = React.useState<Product[]>([]);

  React.useEffect(() => {
    let active = true;

    getSupabaseClient()
      .from('Product')
      .select('*')
      .then(({ data, error }: { data: ProductRow[] | null; error: unknown }) => {
        if (error) throw error;
        if (active) {
          setProducts((data ?? []).map(toProduct));
        }
      })
      .catch((error: unknown) => {
        console.error(error);
      });

    return () => {
      active = false;
    };
  }, []);

  return products;
};

export default useProducts;
