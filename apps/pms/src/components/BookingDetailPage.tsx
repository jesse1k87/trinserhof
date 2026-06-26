import * as React from 'react';
import { BOOKING_STATUSES, canPerform, DEFAULT_BOOKING_STATUS, User } from '@trinserhof/types';
import { CustomerContext } from 'src/context/CustomerContext';
import { bookingsAreDifferent, getStatusIndicator } from '@trinserhof/helpers';
import { Button, HorizontalLine, NoEditingAllowed, PageHeader } from '@trinserhof/ui';
import { StatusIndicator } from '@trinserhof/ui/src/components/StatusIndicator';
import useCollection from 'src/hooks/useCollection';
import { logAuditEvent, saveBooking } from '@trinserhof/database';
import { toast } from 'sonner';
import { BedDouble as BedIcon } from 'lucide-react';
import { type Page } from 'src/types/page';
import { BookingFormFields } from './BookingFormFields';

const getSaveErrorMessage = (error: unknown) => {
  if (error instanceof Error && error.message.startsWith('Invalid booking data:')) {
    return `This booking could not be saved: ${error.message.replace('Invalid booking data: ', '')}`;
  }
  if (error instanceof Error && error.message.includes('PERMISSION_DENIED')) {
    return 'This booking is invalid and could not be saved. Please check all required fields.';
  }
  return 'Something went wrong while saving the booking.';
};

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

  // `useCollection` returns an empty array while the realtime listener is still
  // delivering its first snapshot, so we can't redirect just because the
  // booking isn't found yet — that would bounce straight back to the table
  // before the data arrives. Only redirect once the collection has loaded
  // (non-empty) but this id genuinely isn't in it (e.g. a stale/typed URL).
  // Done in an effect so we never call navigate during render.
  React.useEffect(() => {
    if (bookings.length > 0 && !originalBooking) {
      navigate('bookings-table');
    }
  }, [bookings.length, originalBooking, navigate]);

  if (!booking) return null;

  const enabled = canPerform(user.role, 'BOOKING', 'UPDATE');
  const hasChanges = Boolean(originalBooking && bookingsAreDifferent(originalBooking, booking));

  return (
    <div className="flex flex-col gap-4 w-full max-w-2xl px-4 py-6">
      <div className="flex flex-row items-center justify-between">
        <PageHeader icon={<BedIcon className="size-5" />} title="Booking" />
        <StatusIndicator
          {...getStatusIndicator(
            BOOKING_STATUSES.some((s) => s.id === booking.status)
              ? booking.status
              : DEFAULT_BOOKING_STATUS,
          )}
        />
      </div>

      {!enabled && <NoEditingAllowed />}

      <BookingFormFields
        booking={booking}
        onChange={setBooking}
        user={user}
        enabled={enabled}
        onViewCustomer={setCustomer}
        mode="update"
      />

      <HorizontalLine />

      <div className="flex flex-row justify-end">
        <Button
          variant="outline"
          className="mr-2 hover:cursor-pointer"
          onClick={() => navigate('bookings-table')}
        >
          Back
        </Button>
        {hasChanges && enabled && (
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
