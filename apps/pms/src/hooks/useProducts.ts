import * as React from 'react';
import { onValue, ref } from 'firebase/database';
import { getDb } from '@trinserhof/database';
import { Product } from '@trinserhof/types';

/**
 * Real-time listener on the Firebase `products` collection.
 */
const useProducts = () => {
  const [products, setProducts] = React.useState<Product[]>([]);

  const db = getDb();

  React.useEffect(() => {
    const unsubscribe = onValue(
      ref(db, 'products'),
      (snapshot) => {
        const documents = snapshot.val() ?? {};
        const docsAsArray: Product[] = Object.keys(documents)
          .map((id) => documents[id])
          .filter((product: Product) => !product.deleted);

        setProducts(docsAsArray);
      },
      (error) => {
        console.error(error);
      },
    );

    return () => unsubscribe();
  }, [db]);

  return products;
};

export default useProducts;
