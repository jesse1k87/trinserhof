import { ProductCategory } from '@trinserhof/types';
import * as React from 'react';

export type ProductCategoryContextType = ProductCategory | null;

export type ProductCategoryContextValue = [
  ProductCategoryContextType,
  React.Dispatch<React.SetStateAction<ProductCategoryContextType>>,
];

export const ProductCategoryContext = React.createContext<ProductCategoryContextValue>([
  null,
  () => {},
]);
