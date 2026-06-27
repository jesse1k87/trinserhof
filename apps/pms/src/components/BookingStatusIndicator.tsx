import * as React from 'react';
import { logAuditEvent, saveBooking } from '@trinserhof/database';
import { toast } from 'sonner';
import { getSaveErrorMessage } from '../helpers/getSaveErrorMessage';
import {
  Booking,
  BOOKING_STATUSES,
  BookingStatus,
  canPerform,
  DEFAULT_BOOKING_STATUS,
  User,
} from '@trinserhof/types';
import { Button, StatusIndicator } from '@trinserhof/ui';

const STATUS_INDICATOR: Record<BookingStatus, { color: string; dotClassName?: string }> = {
  PENDING: { color: 'var(--color-gray-400)' },
  CONFIRMED: { color: 'var(--color-orange-400)' },
  CHECKED_IN: { color: 'var(--color-yellow-400)' },
  CHECKED_OUT: { color: 'var(--color-green-600)' },
  CANCELLED: { color: 'var(--color-red-500)' },
};

export const BookingStatusIndicator = ({
  status,
  onClick,
}: {
  status: BookingStatus;
  onClick?: () => void;
}) => {
  const getProps = (status: BookingStatus) => ({
    ...STATUS_INDICATOR[status],
    label: BOOKING_STATUSES.find((s) => s.id === status)?.label ?? status,
  });

  return <StatusIndicator {...getProps(status)} onClick={onClick} />;
};

export const BookingStatusSwitcher = ({
  user,
  booking,
  setBooking,
}: {
  user: User;
  booking: Booking;
  setBooking: any;
}) => {
  const canUpdateBooking = canPerform(user.role, 'BOOKING', 'UPDATE');

  const status = BOOKING_STATUSES.some((s) => s.id === booking.status)
    ? booking.status
    : DEFAULT_BOOKING_STATUS;

  const nextStatusAction =
    status === 'PENDING'
      ? { label: 'Confirm', status: 'CONFIRMED' as const }
      : status === 'CONFIRMED'
        ? { label: 'Check in', status: 'CHECKED_IN' as const }
        : status === 'CHECKED_IN'
          ? { label: 'Check out', status: 'CHECKED_OUT' as const }
          : status === 'CHECKED_OUT'
            ? { label: 'Check in', status: 'CHECKED_IN' as const }
            : null;

  const updateStatus = async (nextStatus: Booking['status']) => {
    try {
      setBooking(await saveBooking({ ...booking, status: nextStatus }));
      logAuditEvent('BOOKING_UPDATED', user.email);
    } catch (error) {
      toast.error(getSaveErrorMessage(error));
    }
  };

  return (
    <div className="flex flex-row gap-2 items-center">
      {canUpdateBooking && (
        <Button
          size="sm"
          variant={status === 'CANCELLED' ? 'ghost' : 'ghost'}
          onClick={() => updateStatus(status === 'CANCELLED' ? 'CONFIRMED' : 'CANCELLED')}
        >
          {status === 'CANCELLED' ? 'Restore' : 'Cancel booking'}
        </Button>
      )}
      {canUpdateBooking && status !== 'CANCELLED' ? (
        <BookingStatusIndicator
          status={booking.status}
          onClick={nextStatusAction ? () => updateStatus(nextStatusAction.status) : undefined}
        />
      ) : (
        <BookingStatusIndicator status={booking.status} />
      )}
    </div>
  );
};
