import * as React from 'react';
import { Booking, canPerform, User } from '@trinserhof/types';
import { getNewBooking } from '@trinserhof/helpers';
import { saveBooking, logAuditEvent } from '@trinserhof/database';
import { Button, PageHeader } from '@trinserhof/ui';
import { CustomerContext } from 'src/context/CustomerContext';
import { type Page } from 'src/types/page';
import { toast } from 'sonner';
import { BedDouble as BedIcon } from 'lucide-react';
import { BookingFormFields } from './BookingFormFields';
import { getSaveErrorMessage } from 'src/helpers/getSaveErrorMessage';

export const BookingCreatePage = ({
  user,
  navigate,
}: {
  user: User;
  navigate: (page: Page) => void;
}) => {
  const [booking, setBooking] = React.useState<Booking>(getNewBooking);
  const [, setCustomer] = React.useContext(CustomerContext);

  const enabled = canPerform(user.role, 'BOOKING', 'CREATE');

  return (
    <div className="flex flex-col gap-4 w-full max-w-2xl px-4 py-6">
      <PageHeader icon={<BedIcon className="size-5" />} title="New booking" />

      <BookingFormFields
        booking={booking}
        onChange={setBooking}
        user={user}
        enabled={enabled}
        onViewCustomer={setCustomer}
        mode="create"
      />

      <div className="flex flex-row justify-end">
        <Button
          variant="outline"
          className="mr-2 hover:cursor-pointer"
          onClick={() => navigate('bookings-table')}
        >
          Cancel
        </Button>
        {enabled && (
          <Button
            className="hover:cursor-pointer"
            onClick={async () => {
              try {
                await saveBooking(booking);
                logAuditEvent('BOOKING_CREATED', user.email);
                navigate('bookings-table');
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
