import { TableReservation } from '@trinserhof/types';

export const tableReservationsAreDifferent = (a: TableReservation, b: TableReservation) => {
  const properties: Array<keyof TableReservation> = [
    'start',
    'end',
    'numberOfPeople',
    'tableId',
    'customerId',
  ];

  return properties.some((property) => a[property] !== b[property]);
};
