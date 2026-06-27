import * as React from 'react';
import { BedDouble as BedIcon } from 'lucide-react';
import {
  Booking,
  BOOKING_STATUSES,
  canPerform,
  DEFAULT_BOOKING_STATUS,
  User,
} from '@trinserhof/types';
import { BookingFormFields } from './BookingFormFields';
import { bookingsAreDifferent, getStatusIndicator } from '@trinserhof/helpers';
import { Button, PageHeader } from '@trinserhof/ui';
import { CustomerContext } from 'src/context/CustomerContext';
import { getSaveErrorMessage } from 'src/helpers/getSaveErrorMessage';
import { logAuditEvent, saveBooking } from '@trinserhof/database';
import { StatusIndicator } from '@trinserhof/ui/src/components/StatusIndicator';
import { toast } from 'sonner';
import { type Page } from 'src/types/page';
import useCollection from 'src/hooks/useCollection';

export const BookingDetailPage = ({
  id,
  user,
  navigate,
}: {
  id: string;
  user: User;
  navigate: (page: Page) => void;
}) => {
  const [, setCustomer] = React.useContext(CustomerContext);

  const bookings = useCollection('bookings');
  const originalBooking = bookings?.find((b) => b?.id === id);

  const [booking, setBooking] = React.useState(originalBooking);

  React.useEffect(() => {
    setBooking(originalBooking);
  }, [originalBooking]);

  React.useEffect(() => {
    if (bookings.length > 0 && !originalBooking) {
      navigate('bookings-table');
    }
  }, [bookings.length, originalBooking, navigate]);

  if (!booking) return null;

  const canUpdateBooking = canPerform(user.role, 'BOOKING', 'UPDATE');
  const hasChanges = Boolean(originalBooking && bookingsAreDifferent(originalBooking, booking));

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
    <div className="flex flex-col gap-4 w-full max-w-2xl px-4 py-6">
      <div className="flex flex-row items-center justify-between">
        <PageHeader icon={<BedIcon className="size-5" />} title="Booking" />
        <StatusIndicator {...getStatusIndicator(status)} />
      </div>

      <div className="flex flex-row items-end justify-between">
        <div>
          {canUpdateBooking && nextStatusAction && !hasChanges && (
            <Button
              className="hover:cursor-pointer"
              onClick={() => updateStatus(nextStatusAction.status)}
            >
              {nextStatusAction.label}
            </Button>
          )}
        </div>
      </div>

      <BookingFormFields
        booking={booking}
        onChange={setBooking}
        user={user}
        enabled={canUpdateBooking}
        onViewCustomer={setCustomer}
      />

      <div className="flex flex-row justify-end">
        {hasChanges && canUpdateBooking && (
          <Button
            className="hover:cursor-pointer"
            onClick={async () => {
              try {
                setBooking(await saveBooking(booking));
                logAuditEvent('BOOKING_UPDATED', user.email);
              } catch (error) {
                toast.error(getSaveErrorMessage(error));
              }
            }}
          >
            Save
          </Button>
        )}
      </div>
    </div>
  );
};
