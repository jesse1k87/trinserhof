import * as React from 'react';
import { BedIcon, ReceiptIcon } from '@trinserhof/ui';
import { canPerform, User } from '@trinserhof/types';
import { BookingFormFields } from './BookingFormFields';
import { bookingsAreDifferent, formatDate } from '@trinserhof/helpers';
import { Button, PageHeader } from '@trinserhof/ui';
import { createInvoiceForBooking } from 'src/helpers/createInvoiceForBooking';
import { CustomerContext } from 'src/context/CustomerContext';
import { getInvoiceSaveErrorMessage } from 'src/helpers/getInvoiceSaveErrorMessage';
import { getSaveErrorMessage } from 'src/helpers/getSaveErrorMessage';
import { logAuditEvent, saveBooking } from '@trinserhof/supabase-db';
import { toast } from 'sonner';
import { type Page } from 'src/types/page';
import useCollection from 'src/hooks/useCollection';
import useInvoices from 'src/hooks/useInvoices';
import { BookingStatusSwitcher } from './BookingStatusIndicator';

export const BookingDetailPage = ({
  id,
  user,
  navigate,
}: {
  id: string;
  user: User;
  navigate: (page: Page, id?: string) => void;
}) => {
  const [, setCustomer] = React.useContext(CustomerContext);

  const bookings = useCollection('bookings');
  const originalBooking = bookings?.find((b) => b?.id === id);
  const invoices = useInvoices();
  const bookingInvoices = invoices.filter((invoice) => invoice.bookingIds?.includes(id));

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
  const canCreateInvoice = canPerform(user.role, 'INVOICE', 'CREATE');
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

      <div className="flex flex-col gap-2">
        <div className="flex flex-row items-center justify-between">
          <h2 className="text-sm font-medium text-muted-foreground">Invoices</h2>
          {bookingInvoices.length === 0 && canCreateInvoice && (
            <Button
              variant="outline"
              size="sm"
              disabled={booking.customers.length === 0}
              title={
                booking.customers.length === 0 ? 'Add a customer to this booking first' : undefined
              }
              className="hover:cursor-pointer"
              onClick={async () => {
                try {
                  const invoice = await createInvoiceForBooking(booking, user.email);
                  navigate('invoice-detail', invoice.id);
                } catch (error) {
                  toast.error(getInvoiceSaveErrorMessage(error));
                }
              }}
            >
              Create invoice
            </Button>
          )}
        </div>
        {bookingInvoices.length > 0 ? (
          <div className="flex flex-col gap-1">
            {bookingInvoices.map((invoice) => (
              <button
                key={invoice.id}
                onClick={() => navigate('invoice-detail', invoice.id)}
                className="flex flex-row items-center gap-2 rounded-md border p-2 text-left hover:bg-muted hover:cursor-pointer"
              >
                <ReceiptIcon className="size-4 text-muted-foreground" />
                <span className="font-medium">{invoice.number}</span>
                {invoice.created && (
                  <span className="text-sm text-muted-foreground">
                    {formatDate(new Date(invoice.created))}
                  </span>
                )}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No invoice yet.</p>
        )}
      </div>

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
