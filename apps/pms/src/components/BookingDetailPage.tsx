import * as React from 'react';
import { BedIcon, InvoiceIcon } from '@trinserhof/ui';
import { canPerform, DEFAULT_LOCALE, User } from '@trinserhof/types';
import { BookingFormFields } from './BookingFormFields';
import { bookingsAreDifferent, formatDate } from '@trinserhof/helpers';
import { Button, PageHeader } from '@trinserhof/ui';
import { createInvoiceForBooking } from 'src/helpers/createInvoiceForBooking';
import { getInvoiceSaveErrorMessage } from 'src/helpers/getInvoiceSaveErrorMessage';
import { getSaveErrorMessage } from 'src/helpers/getSaveErrorMessage';
import { logAuditEvent, saveBooking } from '@trinserhof/supabase';
import { toast } from 'sonner';
import { type Page } from 'src/types/page';
import useBookings from 'src/hooks/useBookings';
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
  const bookings = useBookings();
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
  const locale = user.locale ?? DEFAULT_LOCALE;

  return (
    <div className="flex flex-col gap-4 w-full max-w-2xl px-4 py-6">
      <div className="flex flex-row items-center justify-between">
        <PageHeader
          icon={<BedIcon className="size-5" />}
          title="Booking"
          center={<BookingStatusSwitcher user={user} booking={booking} setBooking={setBooking} />}
        ></PageHeader>
      </div>

      <BookingFormFields
        booking={booking}
        onChange={setBooking}
        user={user}
        enabled={canUpdateBooking}
        onViewCustomer={(customer) => navigate('customer-detail', customer.id)}
      />

      <div className="flex flex-col gap-2">
        <div className="flex flex-row items-center justify-between">
          <h2 className="text-sm font-medium text-base-content/60">Invoices</h2>
          {bookingInvoices.length === 0 && canCreateInvoice && (
            <Button
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
              <Button
                key={invoice.id}
                onClick={() => navigate('invoice-detail', invoice.id)}
                className="flex flex-row items-center gap-2 rounded-md border p-2 text-left hover:bg-base-200 hover:cursor-pointer"
              >
                <InvoiceIcon className="size-4 text-base-content/60" />
                <span className="font-medium">{invoice.number}</span>
                {invoice.created && (
                  <span className="text-sm text-base-content/60">
                    {formatDate(new Date(invoice.created), locale)}
                  </span>
                )}
              </Button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-base-content/60">No invoice yet.</p>
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
