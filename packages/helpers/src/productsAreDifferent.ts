import { Product } from '@trinserhof/types';

export const productsAreDifferent = (a: Product, b: Product) => {
  const properties: Array<keyof Product> = [
    'name',
    'description',
    'price',
    'categoryId',
    'deleted',
  ];

  return properties.some((property) => a[property] !== b[property]);
};
