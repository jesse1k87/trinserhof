import * as React from 'react';
import { getDb, type Product as ProductRow } from '@trinserhof/supabase-db';
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

    getDb()
      .product.findMany()
      .then((rows: ProductRow[]) => {
        if (active) {
          setProducts(rows.map(toProduct));
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
