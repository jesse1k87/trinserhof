import { Product } from '@trinserhof/types';
import * as React from 'react';

export type ProductContextType = Product | null;

export type ProductContextValue = [
  ProductContextType,
  React.Dispatch<React.SetStateAction<ProductContextType>>,
];

export const ProductContext = React.createContext<ProductContextValue>([null, () => {}]);
