import { AccountingCategory } from '@trinserhof/types';

export const accountingCategoriesAreDifferent = (a: AccountingCategory, b: AccountingCategory) => {
  const properties: Array<keyof AccountingCategory> = ['name', 'taxRate'];

  return properties.some((property) => a[property] !== b[property]);
};
