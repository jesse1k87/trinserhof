import { STATUSES, type Status } from '@trinserhof/types';

const STATUS_INDICATOR: Record<Status, { color: string; dotClassName?: string }> = {
  PENDING: { color: 'transparent', dotClassName: 'border-2 border-dashed border-neutral-400' },
  CONFIRMED: { color: 'var(--color-orange-400)' },
  CHECKED_IN: { color: 'var(--color-yellow-400)' },
  CHECKED_OUT: { color: 'var(--color-green-600)' },
  CANCELLED: { color: 'transparent', dotClassName: 'border-2 border-neutral-400' },
};

export const getStatusIndicator = (status: Status) => ({
  ...STATUS_INDICATOR[status],
  label: STATUSES.find((s) => s.id === status)?.label ?? status,
});
