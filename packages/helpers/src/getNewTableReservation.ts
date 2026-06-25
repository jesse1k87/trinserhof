import { type TableReservation } from '@trinserhof/types';
import { uuidv4 } from './uuidv4';

export const getNewTableReservation = (): TableReservation => ({
  id: uuidv4(),
  start: new Date().toISOString(),
  numberOfPeople: 2,
  tableId: '',
});
