import * as React from 'react';
import { BedDouble as BedIcon } from 'lucide-react';
import { canPerform, User } from '@trinserhof/types';
import { BookingFormFields } from './BookingFormFields';
import { bookingsAreDifferent } from '@trinserhof/helpers';
import { Button, PageHeader } from '@trinserhof/ui';
import { CustomerContext } from 'src/context/CustomerContext';
import { getSaveErrorMessage } from 'src/helpers/getSaveErrorMessage';
import { logAuditEvent, saveBooking } from '@trinserhof/database';
import { toast } from 'sonner';
import { type Page } from 'src/types/page';
import useCollection from 'src/hooks/useCollection';
import { BookingStatusSwitcher } from './BookingStatusIndicator';

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

  return (
    <div className="flex flex-col gap-4 w-full max-w-2xl px-4 py-6">
      <div className="flex flex-row items-center justify-between">
        <PageHeader icon={<BedIcon className="size-5" />} title="Booking" />
        <BookingStatusSwitcher user={user} booking={booking} setBooking={setBooking} />
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
