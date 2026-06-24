import { TableReservation } from '@trinserhof/types';

export const tableReservationsAreDifferent = (a: TableReservation, b: TableReservation) => {
  const properties: Array<keyof TableReservation> = [
    'name',
    'start',
    'end',
    'numberOfPeople',
    'tableId',
  ];

  return properties.some((property) => a[property] !== b[property]);
};
