import { type Customer } from '@trinserhof/types';
import { getYYYYmmDD } from './getYYYYmmDD';
import { uuidv4 } from './uuidv4';

export const getNewCustomer = (): Customer => ({
  id: uuidv4(),
  created: getYYYYmmDD(new Date()),
  name: '',
  surname: '',
  email: '',
});
