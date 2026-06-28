'use client';

import * as React from 'react';
import { CheckIcon, SearchIcon as MagnifyingGlassIcon } from '@trinserhof/ui';

import { cn } from '@trinserhof/ui';
import { Button } from '@trinserhof/ui';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@trinserhof/ui';
import { Popover, PopoverContent, PopoverTrigger } from '@trinserhof/ui';
import { CustomerContext } from 'src/context/CustomerContext';
import { ProductContext } from 'src/context/ProductContext';
import useCollection from 'src/hooks/useCollection';
import useCustomers from 'src/hooks/useCustomers';
import useProducts from 'src/hooks/useProducts';
import useRestaurantTables from 'src/hooks/useRestaurantTables';
import { formatCurrency, formatDateTime } from '@trinserhof/helpers';
import { format } from 'date-fns';
import { type Page } from 'src/types/page';
import { RestaurantReservationContext } from '../context/RetaurantReservationContext';
import useRestaurantReservations from '../hooks/useRestaurantReservations';

type SearchItem = {
  value: string;
  type: 'booking' | 'customer' | 'product' | 'restaurantReservation';
  id: string;
  label: string;
  subLabel: string;
  keywords: string[];
};

export function SearchBox({ navigate }: { navigate: (page: Page, id?: string) => void }) {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState('');
  const [search, setSearch] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) setSearch('');
  };

  React.useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const [, setCustomer] = React.useContext(CustomerContext);
  const [, setProduct] = React.useContext(ProductContext);
  const [, setRestaurantReservation] = React.useContext(RestaurantReservationContext);
  const bookings = useCollection('bookings');
  const realCustomers = useCustomers();
  const products = useProducts();
  const restaurantReservations = useRestaurantReservations();
  const tables = useRestaurantTables();

  // Precompute per-item labels and a lowercased search blob once per `bookings`
  // update, instead of on every render and every keystroke (cmdk calls `filter`
  // for every item on every keystroke).
  const {
    bookingItems,
    customerItems,
    productItems,
    restaurantReservationItems,
    searchTextByValue,
  } = React.useMemo(() => {
    const searchTextByValue = new Map<string, string>();
    const realCustomersById = new Map(realCustomers.map((customer) => [customer.id, customer]));

    const bookingItems: SearchItem[] = bookings.map(
      ({ id, customers: customerIds, checkIn, roomId }) => {
        const linkedCustomer = customerIds
          ?.map((customerId) => realCustomersById.get(customerId))
          .find((customer) => customer !== undefined);
        const name = linkedCustomer
          ? [linkedCustomer.name, linkedCustomer.surname].filter(Boolean).join(' ')
          : undefined;

        const label: string[] = [];
        if (typeof roomId === 'string') label.push(`${roomId}.`);
        if (name) label.push(name);
        if (typeof checkIn === 'string') label.push(`(${format(new Date(checkIn), 'LLL d, y')})`);

        const keywords: string[] = [];
        const subLabel: string[] = [];
        if (name) keywords.push(name);
        if (linkedCustomer?.email) {
          keywords.push(linkedCustomer.email);
          subLabel.push(linkedCustomer.email);
        }

        const value = `booking:${id}`;
        searchTextByValue.set(value, `${id} ${keywords.join(' ')}`.toLowerCase());

        return {
          value,
          type: 'booking' as const,
          id,
          label: label.join(' '),
          subLabel: subLabel.join(' '),
          keywords,
        };
      },
    );

    const customerItems: SearchItem[] = realCustomers.map(({ id, email, name, surname, phone }) => {
      const fullName = [name, surname].filter(Boolean).join(' ');

      const keywords: string[] = [];
      const subLabel: string[] = [];
      if (fullName !== '') keywords.push(fullName);
      if (typeof email === 'string' && email !== '') {
        keywords.push(email);
        subLabel.push(email);
      }
      if (typeof phone === 'string' && phone !== '') {
        keywords.push(phone);
        subLabel.push(phone);
      }

      const value = `customer:${id}`;
      searchTextByValue.set(value, `${keywords.join(' ')}`.toLowerCase());

      return {
        value,
        type: 'customer' as const,
        id,
        label: fullName || email || id,
        subLabel: subLabel.join(' '),
        keywords,
      };
    });

    const productItems: SearchItem[] = products.map(({ id, name, price }) => {
      const keywords: string[] = [name];

      const value = `product:${id}`;
      searchTextByValue.set(value, keywords.join(' ').toLowerCase());

      return {
        value,
        type: 'product' as const,
        id,
        label: name,
        subLabel: formatCurrency(price),
        keywords,
      };
    });

    const tablesById = new Map(tables.map((t) => [t.id, t]));

    const restaurantReservationItems: SearchItem[] = restaurantReservations.map(
      ({ id, customerId, start, numberOfPeople, tableId }) => {
        const table = tableId ? tablesById.get(tableId) : undefined;
        const linkedCustomer = customerId ? realCustomersById.get(customerId) : undefined;
        const name = linkedCustomer
          ? [linkedCustomer.name, linkedCustomer.surname].filter(Boolean).join(' ')
          : '';

        const keywords: string[] = [name];
        if (table) keywords.push(String(table.number));

        const subLabel = [
          formatDateTime(new Date(start)),
          table ? String(table.number) : null,
          `${numberOfPeople} guests`,
        ]
          .filter(Boolean)
          .join(' · ');

        const value = `restaurantReservation:${id}`;
        searchTextByValue.set(value, keywords.join(' ').toLowerCase());

        return {
          value,
          type: 'restaurantReservation' as const,
          id,
          label: name || `${numberOfPeople} guests`,
          subLabel,
          keywords,
        };
      },
    );

    return {
      bookingItems,
      customerItems,
      productItems,
      restaurantReservationItems,
      searchTextByValue,
    };
  }, [bookings, realCustomers, products, restaurantReservations, tables]);

  const filter = React.useCallback(
    (itemValue: string, search: string) =>
      searchTextByValue.get(itemValue)?.includes(search.toLowerCase()) ? 1 : 0,
    [searchTextByValue],
  );

  const onSelectItem = (currentValue: string) => {
    setValue(currentValue === value ? '' : currentValue);
    handleOpenChange(false);

    if (currentValue.startsWith('booking:')) {
      const bookingId = currentValue.slice('booking:'.length);
      const selectedBooking = bookings?.find((b) => b?.id === bookingId);
      if (selectedBooking) navigate('booking-detail', selectedBooking.id);
    } else if (currentValue.startsWith('customer:')) {
      const customerId = currentValue.slice('customer:'.length);
      const selectedCustomer = realCustomers.find((c) => c.id === customerId);
      setCustomer(selectedCustomer ?? null);
    } else if (currentValue.startsWith('product:')) {
      const productId = currentValue.slice('product:'.length);
      const selectedProduct = products.find((p) => p.id === productId);
      setProduct(selectedProduct ?? null);
    } else if (currentValue.startsWith('restaurantReservation:')) {
      const restaurantReservationId = currentValue.slice('restaurantReservation:'.length);
      const selectedRestaurantReservation = restaurantReservations.find(
        (tr) => tr.id === restaurantReservationId,
      );
      setRestaurantReservation(selectedRestaurantReservation ?? null);
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          role="combobox"
          aria-expanded={open}
          aria-label="Search"
        >
          <MagnifyingGlassIcon className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="max-w-none p-0"
        style={{ top: '1rem', left: '1rem', right: '1rem', width: 'auto', transform: 'none' }}
      >
        <Command filter={filter}>
          <CommandInput
            ref={inputRef}
            placeholder="Search..."
            className="h-9"
            value={search}
            onValueChange={setSearch}
          />
          {search.length > 0 && (
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              {[
                ['Customers', customerItems],
                ['Bookings', bookingItems],
                ['Products', productItems],
                ['Table reservations', restaurantReservationItems],
              ].map(([heading, items]) => (
                <CommandGroup key={heading as string} heading={heading as string}>
                  {(items as SearchItem[]).map(
                    ({ value: itemValue, label, subLabel, keywords }) => (
                      <CommandItem
                        key={itemValue}
                        value={itemValue}
                        keywords={keywords}
                        onSelect={onSelectItem}
                      >
                        <div className="min-w-0 flex-1 truncate">
                          {label}
                          {subLabel.length > 0 && (
                            <div className="truncate text-xs text-muted-foreground">{subLabel}</div>
                          )}
                        </div>
                        <CheckIcon
                          className={cn(
                            'ml-auto h-4 w-4 shrink-0',
                            itemValue === value ? 'opacity-100' : 'opacity-0',
                          )}
                        />
                      </CommandItem>
                    ),
                  )}
                </CommandGroup>
              ))}
            </CommandList>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
}
