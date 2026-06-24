import { Product } from '@trinserhof/types';

export const productsAreDifferent = (a: Product, b: Product) => {
  const properties: Array<keyof Product> = [
    'name',
    'description',
    'price',
    'categoryId',
    'deleted',
  ];

  if (JSON.stringify(a.variants ?? []) !== JSON.stringify(b.variants ?? [])) {
    return true;
  }

  return properties.some((property) => a[property] !== b[property]);
};
