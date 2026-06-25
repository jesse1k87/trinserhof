import { removeTimeFromDate } from './removeTimeFromDate';

export const TABLE_RESERVATION_DATE_STATUSES = ['PAST', 'TODAY', 'FUTURE'] as const;

export type TableReservationDateStatus = (typeof TABLE_RESERVATION_DATE_STATUSES)[number];

export const getTableReservationDateStatus = (
  start: Date | string,
): TableReservationDateStatus => {
  const startDate = removeTimeFromDate(start) as Date;
  const today = removeTimeFromDate(new Date()) as Date;

  if (startDate < today) return 'PAST';
  if (startDate > today) return 'FUTURE';
  return 'TODAY';
};
