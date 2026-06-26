import { BOOKING_STATUSES, type BookingStatus } from '@trinserhof/types';

const STATUS_INDICATOR: Record<BookingStatus, { color: string; dotClassName?: string }> = {
  PENDING: { color: 'transparent', dotClassName: 'border-2 border-dashed border-neutral-400' },
  CONFIRMED: { color: 'var(--color-orange-400)' },
  CHECKED_IN: { color: 'var(--color-yellow-400)' },
  CHECKED_OUT: { color: 'var(--color-green-600)' },
  CANCELLED: { color: 'transparent', dotClassName: 'border-2 border-neutral-400' },
};

export const getStatusIndicator = (status: BookingStatus) => ({
  ...STATUS_INDICATOR[status],
  label: BOOKING_STATUSES.find((s) => s.id === status)?.label ?? status,
});
