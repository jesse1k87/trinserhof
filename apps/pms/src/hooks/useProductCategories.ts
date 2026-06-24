import * as React from 'react';
import { onValue, ref } from 'firebase/database';
import { getDb } from '@trinserhof/database';
import { ProductCategory } from '@trinserhof/types';

/**
 * Real-time listener on the Firebase `productCategories` collection.
 */
const useProductCategories = () => {
  const [categories, setCategories] = React.useState<ProductCategory[]>([]);

  const db = getDb();

  React.useEffect(() => {
    const unsubscribe = onValue(
      ref(db, 'productCategories'),
      (snapshot) => {
        const documents = snapshot.val() ?? {};
        const docsAsArray: ProductCategory[] = Object.keys(documents)
          .map((id) => documents[id])
          .filter((category: ProductCategory) => !category.deleted);

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

export default useProductCategories;
