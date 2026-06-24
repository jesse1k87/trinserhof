import { type Product } from '@trinserhof/types';
import { uuidv4 } from './uuidv4';

export const getNewProduct = (): Product => ({
  id: uuidv4(),
  name: '',
  price: 0,
  accountingCategoryId: '',
  variants: [],
});
