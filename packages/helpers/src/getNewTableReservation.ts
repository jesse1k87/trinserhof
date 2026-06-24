import { type TableReservation } from '@trinserhof/types';
import { uuidv4 } from './uuidv4';

export const getNewTableReservation = (): TableReservation => {
  const start = new Date();
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);

  return {
    id: uuidv4(),
    name: '',
    start: start.toISOString(),
    end: end.toISOString(),
    numberOfPeople: 2,
    tableId: '',
  };
};
