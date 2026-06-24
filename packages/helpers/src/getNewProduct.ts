import { type Product } from '@trinserhof/types';
import { uuidv4 } from './uuidv4';

export const getNewProduct = (): Product => ({
  id: uuidv4(),
  name: '',
  description: '',
  price: 0,
  categoryId: '',
});
