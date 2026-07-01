import * as React from 'react';
import { BedIcon } from '@trinserhof/ui';
import { Booking, canPerform, User } from '@trinserhof/types';
import { BookingFormFields } from './BookingFormFields';
import { Button, PageHeader } from '@trinserhof/ui';
import { createInvoiceForBooking } from 'src/helpers/createInvoiceForBooking';
import { getInvoiceSaveErrorMessage } from 'src/helpers/getInvoiceSaveErrorMessage';
import { getNewBooking } from '@trinserhof/helpers';
import { getSaveErrorMessage } from 'src/helpers/getSaveErrorMessage';
import { saveBooking, logAuditEvent } from '@trinserhof/supabase';
import { toast } from 'sonner';
import { type Page } from 'src/types/page';

export const BookingCreatePage = ({
  user,
  navigate,
}: {
  user: User;
  navigate: (page: Page, id?: string) => void;
}) => {
  const [booking, setBooking] = React.useState<Booking>(getNewBooking);

  const canCreateBooking = canPerform(user.role, 'BOOKING', 'CREATE');

  if (!canCreateBooking) return null;

  return (
    <div className="flex flex-col gap-4 w-full max-w-2xl px-4 py-6">
      <PageHeader icon={<BedIcon className="size-5" />} title="New booking" />

      <BookingFormFields
        booking={booking}
        onChange={setBooking}
        user={user}
        enabled={canCreateBooking}
        onViewCustomer={(customer) => navigate('customer-detail', customer.id)}
      />

      <div className="flex flex-row justify-end">
        <Button className="mr-2 hover:cursor-pointer" onClick={() => navigate('bookings-table')}>
          Cancel
        </Button>
        <Button
          className="hover:cursor-pointer"
          onClick={async () => {
            try {
              const savedBooking = await saveBooking(booking);
              logAuditEvent('BOOKING_CREATED', user.email);
              if (savedBooking.customers.length > 0) {
                try {
                  await createInvoiceForBooking(savedBooking, user.email);
                } catch (error) {
                  toast.error(getInvoiceSaveErrorMessage(error));
                }
              }
              navigate('bookings-table');
            } catch (error) {
              toast.error(getSaveErrorMessage(error));
            }
          }}
        >
          Save
        </Button>
      </div>
    </div>
  );
};
