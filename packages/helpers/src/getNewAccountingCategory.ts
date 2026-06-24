import { type AccountingCategory } from '@trinserhof/types';
import { uuidv4 } from './uuidv4';

export const getNewAccountingCategory = (): AccountingCategory => ({
  id: uuidv4(),
  name: '',
  taxRate: 0,
  ledgerCode: 0,
});
