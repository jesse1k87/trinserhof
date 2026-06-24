import { ProductCategory } from '@trinserhof/types';

export const productCategoriesAreDifferent = (a: ProductCategory, b: ProductCategory) => {
  const properties: Array<keyof ProductCategory> = ['name', 'taxRate', 'deleted'];

  return properties.some((property) => a[property] !== b[property]);
};
