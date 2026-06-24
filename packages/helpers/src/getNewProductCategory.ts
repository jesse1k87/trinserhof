import { type ProductCategory } from '@trinserhof/types';
import { uuidv4 } from './uuidv4';

export const getNewProductCategory = (): ProductCategory => ({
  id: uuidv4(),
  name: '',
  taxRate: 0,
});
