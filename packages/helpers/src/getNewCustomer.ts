import { type Customer } from '@trinserhof/types';
import { uuidv4 } from './uuidv4';

export const getNewCustomer = (): Customer => ({
  id: uuidv4(),
  name: '',
  email: '',
});
