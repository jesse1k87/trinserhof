import * as React from 'react';
import { Booking, canPerform, Customer, InvoiceProduct, Product, User } from '@trinserhof/types';
import { formatCurrency, formatDate, invoicesAreDifferent } from '@trinserhof/helpers';
import { logAuditEvent, saveInvoice } from '@trinserhof/supabase';
import { toast } from 'sonner';
import { Button } from '@trinserhof/ui/src/components/button';
import { Input } from '@trinserhof/ui/src/components/input';
import { Textarea } from '@trinserhof/ui/src/components/textarea';
import { Sheet, SheetContent, SheetTitle } from '@trinserhof/ui/src/components/sheet';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@trinserhof/ui/src/components/command';
import { Popover, PopoverContent, PopoverTrigger } from '@trinserhof/ui/src/components/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@trinserhof/ui/src/components/select';
import { CaretSortIcon, CheckIcon, PlusIcon, XIcon as Cross2Icon } from '@trinserhof/ui';
import { InvoiceContext } from 'src/context/InvoiceContext';
import { CustomerSelect } from './CustomerSelect';
import { getInvoiceProductLineItems } from 'src/helpers/invoiceLineItems';
import useInvoices from 'src/hooks/useInvoices';
import useCustomers from 'src/hooks/useCustomers';
import useProducts from 'src/hooks/useProducts';
import useCollection from 'src/hooks/useCollection';

const getSaveErrorMessage = (error: unknown) => {
  if (error instanceof Error && error.message.startsWith('Invalid invoice data:')) {
    return `This invoice could not be saved: ${error.message.replace('Invalid invoice data: ', '')}`;
  }
  if (error instanceof Error && error.message.includes('PERMISSION_DENIED')) {
    return 'This invoice is invalid and could not be saved. Please check all required fields.';
  }
  return 'Something went wrong while saving the invoice.';
};

const customerLabel = (customer: Customer): string =>
  [customer.name, customer.surname].filter(Boolean).join(' ') ||
  customer.email ||
  'Unnamed customer';

const bookingLabel = (booking: Booking, customersById: Map<string, Customer>): string => {
  const room = booking.roomId ? `Room ${booking.roomId}` : 'Unassigned room';
  const guest = booking.customers
    ?.map((id) => customersById.get(id))
    .find((customer) => customer !== undefined);
  const guestName = guest ? customerLabel(guest) : 'No guest';
  return `${room} · ${guestName} · ${booking.checkIn}`;
};

// Multi-select picker for linking 0 or more bookings to the invoice. Mirrors the
// multi-select behaviour of CustomerSelect: selected entries show a check and the
// popover stays open so several bookings can be toggled in a row.
const BookingMultiSelect = ({
  bookings,
  customersById,
  linkedIds,
  onToggle,
  enabled,
}: {
  bookings: Booking[];
  customersById: Map<string, Customer>;
  linkedIds: string[];
  onToggle: (bookingId: string) => void;
  enabled: boolean;
}) => {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={!enabled}
          className="justify-between hover:cursor-pointer"
        >
          Link a booking
          <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0">
        <Command>
          <CommandInput placeholder="Search bookings…" className="h-9" />
          <CommandList>
            <CommandEmpty>No bookings found.</CommandEmpty>
            <CommandGroup>
              {bookings.map((booking) => {
                const label = bookingLabel(booking, customersById);
                return (
                  <CommandItem
                    key={booking.id}
                    value={booking.id}
                    keywords={[label, booking.roomId, booking.checkIn]}
                    onSelect={() => onToggle(booking.id)}
                  >
                    <div>{label}</div>
                    <CheckIcon
                      className={`ml-auto h-4 w-4 ${
                        linkedIds.includes(booking.id) ? 'opacity-100' : 'opacity-0'
                      }`}
                    />
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export const InvoiceDetails = ({ user }: { user: User }) => {
  const [invoice, setInvoice] = React.useContext(InvoiceContext);

  const invoices = useInvoices();
  const customers = useCustomers();
  const products = useProducts();
  const bookings = useCollection('bookings');

  const [productToAdd, setProductToAdd] = React.useState<string>('');

  const originalInvoice = invoices?.find((i) => i.id === invoice?.id);

  const [hasChanges, setHasChanges] = React.useState<boolean>(!originalInvoice);

  React.useEffect(() => {
    if (!invoice) return;
    setHasChanges(Boolean(!originalInvoice || invoicesAreDifferent(originalInvoice, invoice)));
  }, [invoice, invoices]);

  const customersById = React.useMemo(
    () => new Map(customers.map((customer) => [customer.id, customer])),
    [customers],
  );
  const bookingsById = React.useMemo(
    () => new Map(bookings.map((booking) => [booking.id, booking])),
    [bookings],
  );
  const productsById = React.useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  );

  if (!invoice || !user) return null;

  const enabled = canPerform(user.role, 'INVOICE', 'UPDATE');
  const payer = customersById.get(invoice.customerId);
  const linkedBookings = (invoice.bookingIds ?? [])
    .map((id) => bookingsById.get(id))
    .filter((booking): booking is Booking => booking !== undefined);

  const toggleBooking = (bookingId: string) => {
    const isLinked = invoice.bookingIds.includes(bookingId);
    setInvoice({
      ...invoice,
      bookingIds: isLinked
        ? invoice.bookingIds.filter((id) => id !== bookingId)
        : [...invoice.bookingIds, bookingId],
    });
  };

  const invoiceProducts = invoice.products ?? [];

  // The invoice's product entries paired with their position in the stored
  // array, sorted by when they were added (oldest first) so they read top to
  // bottom chronologically. The original index is kept so edits/removals target
  // the right entry regardless of display order.
  const sortedProductEntries = invoiceProducts
    .map((entry, index) => ({ entry, index }))
    .sort((a, b) => a.entry.addedAt.localeCompare(b.entry.addedAt));

  const productLineItems = getInvoiceProductLineItems(invoice, productsById);
  const productsTotal = productLineItems.reduce((sum, item) => sum + item.amount, 0);

  const addProduct = (productId: string) => {
    if (!productId) return;
    const entry: InvoiceProduct = {
      productId,
      quantity: 1,
      addedAt: new Date().toISOString(),
    };
    setInvoice({ ...invoice, products: [...invoiceProducts, entry] });
    setProductToAdd('');
  };

  const updateProductQuantity = (index: number, quantity: number) => {
    setInvoice({
      ...invoice,
      products: invoiceProducts.map((entry, i) => (i === index ? { ...entry, quantity } : entry)),
    });
  };

  const removeProduct = (index: number) => {
    setInvoice({
      ...invoice,
      products: invoiceProducts.filter((_, i) => i !== index),
    });
  };

  const sortedProducts: Product[] = [...products].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <Sheet open onOpenChange={(open) => !open && setInvoice(null)}>
      <SheetContent
        side="right"
        onOpenAutoFocus={(event) => event.preventDefault()}
        className="flex flex-col grid gap-4 grid-cols-1 content-start overflow-y-auto p-6 pb-12"
      >
        <SheetTitle className="sr-only">Invoice details</SheetTitle>

        <div className="flex flex-col w-full grid gap-1">
          <div className="pt-1 text-xs text-muted-foreground">Invoice number</div>
          <div className="rounded-md border px-3 py-2 text-sm font-medium">{invoice.number}</div>
        </div>

        <div className="flex flex-col w-full grid gap-1">
          <div className="pt-1 text-xs text-muted-foreground">Created</div>
          <Input
            type="date"
            value={invoice.created}
            disabled={!enabled}
            onChange={(event) => setInvoice({ ...invoice, created: event.target.value })}
          />
        </div>

        <div className="flex flex-col w-full grid gap-1">
          <div className="pt-1 text-xs text-muted-foreground">Customer (pays the invoice)</div>
          {payer && (
            <div className="rounded-md border px-3 py-2 text-sm">
              {customerLabel(payer)}
              {payer.email && <div className="text-xs text-muted-foreground">{payer.email}</div>}
            </div>
          )}
          <CustomerSelect
            customers={customers}
            triggerLabel={payer ? 'Change customer' : 'Select customer'}
            onSelect={(customer) => setInvoice({ ...invoice, customerId: customer.id })}
            user={user}
            enabled={enabled}
          />
        </div>

        <div className="flex flex-col w-full grid gap-2">
          <div className="pt-1 text-xs text-muted-foreground">Bookings</div>
          {linkedBookings.map((booking) => (
            <div key={booking.id} className="flex flex-row gap-2 items-center">
              <div className="flex-1 rounded-md border px-3 py-2 text-sm">
                {bookingLabel(booking, customersById)}
                {booking.pricePerNight !== undefined && (
                  <div className="text-xs text-muted-foreground">
                    {formatCurrency(booking.pricePerNight)} / night
                  </div>
                )}
              </div>
              {enabled && (
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Unlink booking"
                  className="shrink-0 hover:cursor-pointer"
                  onClick={() => toggleBooking(booking.id)}
                >
                  <Cross2Icon />
                </Button>
              )}
            </div>
          ))}
          {linkedBookings.length === 0 && (
            <div className="text-sm text-muted-foreground">No bookings linked.</div>
          )}
          <BookingMultiSelect
            bookings={bookings}
            customersById={customersById}
            linkedIds={invoice.bookingIds ?? []}
            onToggle={toggleBooking}
            enabled={enabled}
          />
        </div>

        <div className="flex flex-col w-full grid gap-2">
          <div className="pt-1 text-xs text-muted-foreground">Products</div>
          {sortedProductEntries.map(({ entry, index }) => {
            const product = productsById.get(entry.productId);
            const unitPrice = product?.price ?? 0;
            return (
              <div
                key={`${entry.productId}-${entry.addedAt}`}
                className="flex flex-row gap-2 items-center"
              >
                <div className="flex-1 rounded-md border px-3 py-2 text-sm">
                  <div className="flex flex-row justify-between gap-2">
                    <span>{product?.name ?? 'Unknown product'}</span>
                    <span className="text-muted-foreground">
                      {formatCurrency(unitPrice * entry.quantity)}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatCurrency(unitPrice)} each · added {formatDate(new Date(entry.addedAt))}
                  </div>
                </div>
                <Input
                  type="number"
                  min={1}
                  value={entry.quantity}
                  disabled={!enabled}
                  aria-label="Quantity"
                  className="w-20"
                  onChange={(event) =>
                    updateProductQuantity(index, Math.max(1, Number(event.target.value) || 1))
                  }
                />
                {enabled && (
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Remove product"
                    className="shrink-0 hover:cursor-pointer"
                    onClick={() => removeProduct(index)}
                  >
                    <Cross2Icon />
                  </Button>
                )}
              </div>
            );
          })}
          {sortedProductEntries.length === 0 && (
            <div className="text-sm text-muted-foreground">No products added.</div>
          )}
          {enabled && (
            <div className="flex flex-row gap-2 items-center">
              <Select value={productToAdd} onValueChange={setProductToAdd}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent>
                  {sortedProducts.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} · {formatCurrency(product.price)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                disabled={!productToAdd}
                className="shrink-0 hover:cursor-pointer"
                onClick={() => addProduct(productToAdd)}
              >
                <PlusIcon />
                Add
              </Button>
            </div>
          )}
          {productLineItems.length > 0 && (
            <div className="flex flex-row justify-between pt-1 text-sm">
              <span className="text-muted-foreground">Products total</span>
              <span className="font-medium">{formatCurrency(productsTotal)}</span>
            </div>
          )}
        </div>

        <div className="flex flex-col w-full grid gap-1">
          <div className="pt-1 text-xs text-muted-foreground">Notes</div>
          <Textarea
            placeholder="Optional notes shown on the invoice"
            value={invoice.notes ?? ''}
            disabled={!enabled}
            onChange={(event) => setInvoice({ ...invoice, notes: event.target.value })}
          />
        </div>

        {enabled && hasChanges && (
          <div className="flex flex-row justify-end w-full">
            <Button
              variant="outline"
              className="mr-2"
              onClick={() => setInvoice(originalInvoice ?? null)}
            >
              Cancel
            </Button>
            <Button
              disabled={!invoice.customerId}
              onClick={async () => {
                try {
                  setInvoice(await saveInvoice(invoice));
                  logAuditEvent(
                    originalInvoice ? 'INVOICE_UPDATED' : 'INVOICE_CREATED',
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
