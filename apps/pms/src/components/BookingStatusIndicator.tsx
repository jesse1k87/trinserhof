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
import {
  BOOKING_STATUS_ICONS,
  ICONS,
  Popover,
  PopoverContent,
  PopoverTrigger,
  StatusIndicator,
} from '@trinserhof/ui';

const ARRIVAL_HOUR = 16;
const DEPARTURE_HOUR = 10;

const DEFAULT_COLOR = 'var(--color-gray-600)';
const PENDING_COLOR = 'var(--color-gray-400)';
const CANCELLED_COLOR = 'var(--color-gray-200)';
const OK_COLOR = 'var(--color-green-500)';
const NOT_OK_COLOR = 'var(--color-orange-500)';

export const getStatusColor = (
  status: BookingStatus,
  checkIn: string,
  checkOut: string,
  now: Date = new Date(),
): string => {
  if (status === 'PENDING') return PENDING_COLOR;
  if (status === 'CANCELLED') return CANCELLED_COLOR;

  const checkInDeadline = new Date(checkIn);
  checkInDeadline.setHours(ARRIVAL_HOUR, 0, 0, 0);

  const checkOutDeadline = new Date(checkOut);
  checkOutDeadline.setHours(DEPARTURE_HOUR, 0, 0, 0);

  const checkOutStartOfDay = new Date(checkOut);
  checkOutStartOfDay.setHours(0, 0, 0, 0);

  if (now >= checkOutDeadline) return status === 'CHECKED_OUT' ? OK_COLOR : NOT_OK_COLOR; // After checkout deadline: must be CHECKED_OUT

  if (status === 'CHECKED_OUT' && now < checkOutStartOfDay) return NOT_OK_COLOR; // Early checkout anomaly: CHECKED_OUT before midnight on the day of checkout

  if (now >= checkInDeadline)
    return status === 'CHECKED_IN' || status === 'CHECKED_OUT' ? OK_COLOR : NOT_OK_COLOR; // During the stay: can be CHECKED_IN, or CHECKED_OUT (if checking out on the correct day)

  if (status === 'CHECKED_IN') return NOT_OK_COLOR; // Early check-in anomaly: CHECKED_IN before 16:00 on check-in day

  return DEFAULT_COLOR; // Default fallback (e.g., PENDING/CONFIRMED before check-in deadline is OK)
};

export const getStatusLabel = (
  status: BookingStatus,
  checkIn: string,
  checkOut: string,
  now: Date = new Date(),
): string => {
  const baseLabel = BOOKING_STATUSES.find((s) => s.id === status)?.label ?? status;

  const checkInDeadline = new Date(checkIn);
  checkInDeadline.setHours(ARRIVAL_HOUR, 0, 0, 0);

  const checkOutDeadline = new Date(checkOut);
  checkOutDeadline.setHours(DEPARTURE_HOUR, 0, 0, 0);

  if (status === 'CONFIRMED' && now >= checkInDeadline) {
    return 'Check in due';
  }

  if (status === 'CHECKED_IN' && now >= checkOutDeadline) {
    return 'Check out due';
  }

  return baseLabel;
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
  const now = new Date();
  const label = getStatusLabel(status, checkIn, checkOut, now);
  const color = getStatusColor(status, checkIn, checkOut, now);

  const isPending = status === 'PENDING';

  const Icon = BOOKING_STATUS_ICONS[status as keyof typeof BOOKING_STATUS_ICONS];

  return (
    <StatusIndicator
      color={color}
      label={label}
      icon={<Icon className="size-4" />}
      onClick={onClick}
      className={isPending ? 'border-dashed border-0' : 'border-solid border-0'}
      style={{ borderStyle: isPending ? 'dashed' : 'solid' }}
    />
  );
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
  const [open, setOpen] = React.useState(false);
  const canUpdateBooking = canPerform(user.role, 'BOOKING', 'UPDATE');

  const status = BOOKING_STATUSES.some((s) => s.id === booking.status)
    ? booking.status
    : DEFAULT_BOOKING_STATUS;

  const updateStatus = async (nextStatus: Booking['status']) => {
    setOpen(false);
    if (nextStatus === status) return;
    try {
      setBooking(await saveBooking({ ...booking, status: nextStatus }));
      logAuditEvent('BOOKING_UPDATED', user.email);
    } catch (error) {
      toast.error(getSaveErrorMessage(error));
    }
  };

  if (!canUpdateBooking) {
    return (
      <BookingStatusIndicator
        status={booking.status}
        checkIn={booking.checkIn}
        checkOut={booking.checkOut}
      />
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" aria-expanded={open}>
          <BookingStatusIndicator
            status={booking.status}
            checkIn={booking.checkIn}
            checkOut={booking.checkOut}
          />
          <ICONS.sort className="h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent>
        <ul className="menu">
          {BOOKING_STATUSES.map((s) => (
            <li key={s.id} className={s.id === status ? 'menu-active' : undefined}>
              <button type="button" onClick={() => updateStatus(s.id)}>
                <BookingStatusIndicator
                  status={s.id}
                  checkIn={booking.checkIn}
                  checkOut={booking.checkOut}
                />
              </button>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
};
