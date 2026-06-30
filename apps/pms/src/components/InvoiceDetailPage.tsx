import * as React from 'react';
import { canPerform, Customer, User } from '@trinserhof/types';
import { formatCurrency, formatDate } from '@trinserhof/helpers';
import useProducts from 'src/hooks/useProducts';
import {
  Button,
  ICONS,
  PageHeader,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@trinserhof/ui';
import { type Page } from 'src/types/page';
import useInvoices from 'src/hooks/useInvoices';
import useCustomers from 'src/hooks/useCustomers';
import useBookings from 'src/hooks/useBookings';
import { getInvoiceLineItems, getInvoiceProductLineItems } from 'src/helpers/invoiceLineItems';

const customerLabel = (customer: Customer): string =>
  [customer.name, customer.surname].filter(Boolean).join(' ') ||
  customer.email ||
  'Unnamed customer';

const customerAddressLines = (customer: Customer): string[] => {
  const line1 = [customer.street, customer.streetNumber].filter(Boolean).join(' ');
  const line2 = [customer.postcode, customer.city].filter(Boolean).join(' ');
  return [line1, line2, customer.country].filter((line): line is string => Boolean(line));
};

export const InvoiceDetailPage = ({
  id,
  user,
  navigate,
}: {
  id: string;
  user: User;
  navigate: (page: Page, id?: string) => void;
}) => {
  const invoices = useInvoices();
  const customers = useCustomers();
  const products = useProducts();
  const bookings = useBookings();

  const invoice = invoices.find((i) => i.id === id);

  React.useEffect(() => {
    if (invoices.length > 0 && !invoice) {
      navigate('invoices-table');
    }
  }, [invoices.length, invoice, navigate]);

  if (!invoice) return null;

  const payer = customers.find((customer) => customer.id === invoice.customerId);
  const bookingsById = new Map(bookings.map((booking) => [booking.id, booking]));
  const invoiceBookings = (invoice.bookingIds ?? [])
    .map((bookingId) => bookingsById.get(bookingId))
    .filter((booking): booking is NonNullable<typeof booking> => Boolean(booking));
  const productsById = new Map(products.map((product) => [product.id, product]));
  const lineItems = getInvoiceLineItems(invoice, bookingsById);
  const productLineItems = getInvoiceProductLineItems(invoice, productsById);
  const total =
    lineItems.reduce((sum, item) => sum + item.amount, 0) +
    productLineItems.reduce((sum, item) => sum + item.amount, 0);

  const canUpdate = canPerform(user.role, 'INVOICE', 'UPDATE');

  return (
    <div className="flex flex-col gap-4 w-full max-w-3xl px-4 py-6">
      <div className="flex flex-row items-center justify-between">
        <div className="flex flex-row items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Back to invoices"
            className="hover:cursor-pointer"
            onClick={() => navigate('invoices-table')}
          >
            <ICONS.arrowLeft />
          </Button>
          <PageHeader icon={<ICONS.invoice className="size-5" />} title="Invoice" />
        </div>
        {canUpdate && (
          <Button
            variant="outline"
            className="hover:cursor-pointer"
            onClick={() => navigate('invoice-edit', invoice.id)}
          >
            <ICONS.edit className="size-4" />
            Edit
          </Button>
        )}
      </div>

      {/* The invoice document itself. */}
      <div className="rounded-lg border bg-base-100 p-8 shadow-sm flex flex-col gap-8">
        <div className="flex flex-row justify-between gap-6">
          <div className="flex flex-col">
            <div className="text-lg font-semibold">Hotel Trinserhof</div>
            <div className="text-sm text-base-content/60">www.trinserhof.com</div>
            <div className="text-sm text-base-content/60">Trins 106, 6152</div>
            <div className="text-sm text-base-content/60">Trins, Tirol, Austria</div>
          </div>
          <div className="flex flex-col items-end text-right">
            <div className="text-2xl font-bold tracking-tight">INVOICE</div>
            <div className="text-sm font-medium">{invoice.number}</div>
            <div className="text-sm text-base-content/60">
              {invoice.created ? formatDate(new Date(invoice.created)) : '—'}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <div className="text-xs uppercase tracking-wide text-base-content/60">Bill to</div>
          {payer ? (
            <div className="text-sm">
              <div className="font-medium">{customerLabel(payer)}</div>
              {customerAddressLines(payer).map((line) => (
                <div key={line} className="text-base-content/60">
                  {line}
                </div>
              ))}
              {payer.email && <div className="text-base-content/60">{payer.email}</div>}
              {payer.phone && <div className="text-base-content/60">{payer.phone}</div>}
            </div>
          ) : (
            <div className="text-sm text-base-content/60">Unknown customer</div>
          )}
        </div>

        <div className="rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead className="text-center">Nights</TableHead>
                <TableHead className="text-right">Price / night</TableHead>
                <TableHead className="text-right">City tax</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lineItems.length ? (
                lineItems.map((item) => (
                  <TableRow key={item.bookingId}>
                    <TableCell>{item.description}</TableCell>
                    <TableCell className="text-center">{item.nights}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.pricePerNight)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.nights * 2.6 * item.amountOfPeople)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.nights * (item.pricePerNight + 2.6))}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-16 text-center text-base-content/60">
                    No bookings linked to this invoice.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {productLineItems.length > 0 && (
          <div className="flex flex-col gap-2">
            <div className="text-xs uppercase tracking-wide text-base-content/60">Products</div>
            <div className="rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Added</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Unit price</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productLineItems.map((item) => (
                    <TableRow key={`${item.productId}-${item.addedAt}`}>
                      <TableCell>{item.description}</TableCell>
                      <TableCell>{formatDate(new Date(item.addedAt))}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        <div className="flex flex-row justify-end">
          <div className="flex w-64 flex-row justify-between border-t pt-3">
            <span className="text-sm font-semibold">Total</span>
            <span className="text-sm font-semibold">{formatCurrency(total)}</span>
          </div>
        </div>

        {invoice.notes && (
          <div className="flex flex-col gap-1">
            <div className="text-xs uppercase tracking-wide text-base-content/60">Notes</div>
            <div className="whitespace-pre-wrap text-sm text-base-content/60">{invoice.notes}</div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-base-content/60">Bookings</h2>
        {invoiceBookings.length > 0 ? (
          <div className="flex flex-col gap-1">
            {invoiceBookings.map((booking) => (
              <button
                key={booking.id}
                onClick={() => navigate('booking-detail', booking.id)}
                className="flex flex-row items-center gap-2 rounded-md border p-2 text-left hover:bg-base-200 hover:cursor-pointer"
              >
                <ICONS.bed className="size-4 text-base-content/60" />
                <span className="font-medium">Room {booking.roomId}</span>
                <span className="text-sm text-base-content/60">
                  {formatDate(new Date(booking.checkIn))}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-base-content/60">No bookings linked to this invoice.</p>
        )}
      </div>
    </div>
  );
};
