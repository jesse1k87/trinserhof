import * as React from 'react';
import { Booking, canPerform, User } from '@trinserhof/types';
import { getNewBooking } from '@trinserhof/helpers';
import { saveBooking, logAuditEvent } from '@trinserhof/database';
import { Button, HorizontalLine, NoEditingAllowed, PageHeader } from '@trinserhof/ui';
import { CustomerContext } from 'src/context/CustomerContext';
import { type Page } from 'src/types/page';
import { toast } from 'sonner';
import { BedDouble as BedIcon } from 'lucide-react';
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

      {!enabled && <NoEditingAllowed />}

      <BookingFormFields
        booking={booking}
        onChange={setBooking}
        user={user}
        enabled={enabled}
        onViewCustomer={setCustomer}
      />

      <HorizontalLine />

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
