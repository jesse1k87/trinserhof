import * as React from 'react';
import { logAuditEvent, saveBooking } from '@trinserhof/supabase';
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

const ARRIVAL_HOUR = 16;
const DEPARTURE_HOUR = 10;

const OK_COLOR = 'var(--color-green-500)';
const NOT_OK_COLOR = 'var(--color-orange-500)';

// Guests can only get into their room from 16:00 on the check-in day and must
// be out before 10:00 on the check-out day, so the booking is "not ok" once
// those deadlines pass without the matching status update.
export const isBookingOk = (
  status: BookingStatus,
  checkIn: string,
  checkOut: string,
  now: Date = new Date(),
): boolean => {
  if (status === 'CANCELLED') return true;

  const checkInDeadline = new Date(checkIn);
  checkInDeadline.setHours(ARRIVAL_HOUR, 0, 0, 0);

  const checkOutDeadline = new Date(checkOut);
  checkOutDeadline.setHours(DEPARTURE_HOUR, 0, 0, 0);

  if (now >= checkOutDeadline) return status === 'CHECKED_OUT';
  if (now >= checkInDeadline) return status === 'CHECKED_IN' || status === 'CHECKED_OUT';
  return true;
};

export const BookingStatusIndicator = ({
  status,
  checkIn,
  checkOut,
  onClick,
}: {
  status: BookingStatus;
  checkIn: string;
  checkOut: string;
  onClick?: () => void;
}) => {
  const label = BOOKING_STATUSES.find((s) => s.id === status)?.label ?? status;
  const color = isBookingOk(status, checkIn, checkOut) ? OK_COLOR : NOT_OK_COLOR;

  return <StatusIndicator color={color} label={label} onClick={onClick} />;
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
          checkIn={booking.checkIn}
          checkOut={booking.checkOut}
          onClick={nextStatusAction ? () => updateStatus(nextStatusAction.status) : undefined}
        />
      ) : (
        <BookingStatusIndicator
          status={booking.status}
          checkIn={booking.checkIn}
          checkOut={booking.checkOut}
        />
      )}
    </div>
  );
};
