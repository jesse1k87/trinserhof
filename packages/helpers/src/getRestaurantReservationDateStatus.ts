import { removeTimeFromDate } from './removeTimeFromDate';

export const TABLE_RESERVATION_DATE_STATUSES = ['PAST', 'TODAY', 'FUTURE'] as const;

export type RestaurantReservationDateStatus = (typeof TABLE_RESERVATION_DATE_STATUSES)[number];

export const getRestaurantReservationDateStatus = (
  start: Date | string,
): RestaurantReservationDateStatus => {
  const startDate = removeTimeFromDate(start) as Date;
  const today = removeTimeFromDate(new Date()) as Date;

  if (startDate < today) return 'PAST';
  if (startDate > today) return 'FUTURE';
  return 'TODAY';
};
