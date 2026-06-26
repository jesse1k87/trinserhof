import * as React from 'react';
import {
  Booking,
  canPerform,
  DEFAULT_BOOKING_STATUS,
  BOOKING_STATUSES,
  User,
} from '@trinserhof/types';
import { BookingContext } from 'src/context/BookingContext';
import { CustomerContext } from 'src/context/CustomerContext';
import { bookingsAreDifferent, getStatusIndicator } from '@trinserhof/helpers';
import { Button } from '@trinserhof/ui/src/components/button';
import { Sheet, SheetContent, SheetTitle } from '@trinserhof/ui/src/components/sheet';
import { StatusIndicator } from '@trinserhof/ui/src/components/StatusIndicator';
import useCollection from 'src/hooks/useCollection';
import { logAuditEvent, saveBooking } from '@trinserhof/database';
import { NoEditingAllowed } from '@trinserhof/ui';
import { toast } from 'sonner';
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

export const BookingDetails = ({ user }: { user: User }) => {
  const [booking, setBooking] = React.useContext(BookingContext);
  const [, setCustomer] = React.useContext(CustomerContext);

  const bookings = useCollection('bookings');

  const originalBooking = bookings?.find((b) => b?.id === booking?.id);

  const [hasChanges, setHasChanges] = React.useState<boolean>(!originalBooking);

  const checkForChanges = (booking: Booking) =>
    setHasChanges(
      Boolean(
        !originalBooking || (originalBooking && bookingsAreDifferent(originalBooking, booking)),
      ),
    );

  React.useEffect(() => {
    if (!booking) return;
    checkForChanges(booking);
  }, [booking, bookings]);

  if (!booking) return null;

  if (!user) return null;

  const enabled = canPerform(user.role, 'BOOKING', 'UPDATE');

  // Normalise legacy/missing statuses into the PENDING bucket, mirroring the
  // status indicator below (and BookingsTable). Otherwise a booking with an
  // unrecognised status would display as "Pending" but get no action button.
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

  const updateStatus = async (status: Booking['status']) => {
    try {
      const updated = await saveBooking({ ...booking, status });
      setBooking(updated);
      logAuditEvent('BOOKING_UPDATED', user.email);
    } catch (error) {
      toast.error(getSaveErrorMessage(error));
    }
  };

  return (
    <Sheet open onOpenChange={(open) => !open && setBooking(null)}>
      <SheetContent
        side="right"
        onOpenAutoFocus={(event) => event.preventDefault()}
        className="flex flex-col grid gap-4 grid-cols-1 content-start overflow-y-auto p-6 pb-12 outline-none"
      >
        <SheetTitle className="sr-only">Booking details</SheetTitle>
        {!enabled && <NoEditingAllowed />}

        <div className="flex flex-row justify-end">
          <StatusIndicator {...getStatusIndicator(status)} />
        </div>

        <BookingFormFields
          booking={booking}
          onChange={setBooking}
          user={user}
          enabled={enabled}
          onViewCustomer={(c) => {
            setBooking(null);
            setCustomer(c);
          }}
          mode="update"
        />

        {enabled && nextStatusAction && (
          <div className="flex flex-row justify-end w-full">
            <Button onClick={() => updateStatus(nextStatusAction.status)}>
              {nextStatusAction.label}
            </Button>
          </div>
        )}

        {hasChanges && (
          <div className="flex flex-row justify-end w-full">
            <Button
              variant="outline"
              className="mr-2"
              onClick={() => setBooking(originalBooking ?? null)}
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                try {
                  setBooking(await saveBooking(booking));
                  logAuditEvent(
                    originalBooking ? 'BOOKING_UPDATED' : 'BOOKING_CREATED',
                    user.email,
                  );
                } catch (error) {
                  toast.error(getSaveErrorMessage(error));
                }
              }}
            >
              Save
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
