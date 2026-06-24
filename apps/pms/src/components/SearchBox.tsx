'use client';

import * as React from 'react';
import { CaretSortIcon, CheckIcon } from '@radix-ui/react-icons';

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
import { BookingContext } from 'src/context/BookingContext';
import { CustomerContext } from 'src/context/CustomerContext';
import { TimelineContext } from 'src/context/TimelineContext';
import useCollection from 'src/hooks/useCollection';
import useCustomers from 'src/hooks/useCustomers';
import { getCustomers } from 'src/helpers/getCustomers';
import { removeTimeFromDate, resolveCustomerForEmail } from '@trinserhof/helpers';
import { format } from 'date-fns';

type SearchItem = {
  value: string;
  type: 'booking' | 'customer';
  id: string;
  label: string;
  subLabel: string;
  keywords: string[];
};

export function SearchBox() {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState('');

  const [, setBooking] = React.useContext(BookingContext);
  const [, setCustomer] = React.useContext(CustomerContext);
  const timelineRef = React.useContext(TimelineContext);
  const bookings = useCollection('bookings');
  const realCustomers = useCustomers();

  // Precompute per-item labels and a lowercased search blob once per `bookings`
  // update, instead of on every render and every keystroke (cmdk calls `filter`
  // for every item on every keystroke).
  const { bookingItems, customerItems, searchTextByValue, customersByEmail } = React.useMemo(() => {
    const searchTextByValue = new Map<string, string>();
    const customersByEmail = new Map<string, { name?: string; phone?: string }>();

    const bookingItems: SearchItem[] = bookings.map(
      ({ id, name, notes, email, checkIn, roomId }) => {
        const label: string[] = [];
        if (typeof roomId === 'string') label.push(`${roomId}.`);
        if (typeof name === 'string') label.push(name);
        if (typeof checkIn === 'string') label.push(`(${format(new Date(checkIn), 'LLL d, y')})`);

        const keywords: string[] = [];
        const subLabel: string[] = [];
        if (typeof name === 'string') keywords.push(name);
        if (typeof notes === 'string') {
          keywords.push(notes);
          subLabel.push(notes);
        }
        if (typeof email === 'string') {
          keywords.push(email);
          subLabel.push(email);
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

    const realCustomersByEmail = new Map(
      realCustomers.map((customer) => [customer.email.trim().toLowerCase(), customer]),
    );

    const customers = getCustomers(bookings);
    const customerItems: SearchItem[] = customers.map(({ email, name, phone }) => {
      const realCustomer = realCustomersByEmail.get(email.trim().toLowerCase());
      const fullName = [realCustomer?.name ?? name, realCustomer?.surname]
        .filter(Boolean)
        .join(' ');

      const keywords: string[] = [email];
      const subLabel: string[] = [email];
      if (fullName !== '') keywords.push(fullName);
      if (typeof phone === 'string' && phone !== '') {
        keywords.push(phone);
        subLabel.push(phone);
      }

      const value = `customer:${email}`;
      searchTextByValue.set(value, `${keywords.join(' ')}`.toLowerCase());
      customersByEmail.set(email, { name, phone });

      return {
        value,
        type: 'customer' as const,
        id: email,
        label: fullName || email,
        subLabel: subLabel.join(' '),
        keywords,
      };
    });

    return { bookingItems, customerItems, searchTextByValue, customersByEmail };
  }, [bookings, realCustomers]);

  const filter = React.useCallback(
    (itemValue: string, search: string) =>
      searchTextByValue.get(itemValue)?.includes(search.toLowerCase()) ? 1 : 0,
    [searchTextByValue],
  );

  const selectedItem = React.useMemo(
    () => [...bookingItems, ...customerItems].find((item) => item.value === value),
    [bookingItems, customerItems, value],
  );

  const onSelectItem = (currentValue: string) => {
    setValue(currentValue === value ? '' : currentValue);
    setOpen(false);

    if (currentValue.startsWith('booking:')) {
      const bookingId = currentValue.slice('booking:'.length);
      const selectedBooking = bookings?.find((b) => b?.id === bookingId);
      setBooking(selectedBooking ?? null);
      if (selectedBooking) {
        const checkInDate = removeTimeFromDate(selectedBooking.checkIn);
        if (checkInDate) timelineRef.current?.moveTo(checkInDate);
      }
    } else if (currentValue.startsWith('customer:')) {
      const email = currentValue.slice('customer:'.length);
      setCustomer(resolveCustomerForEmail(email, realCustomers, customersByEmail.get(email)));
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-max justify-between"
        >
          {value ? selectedItem?.label : 'Search...'}
          <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[26rem] max-w-[calc(100vw-2rem)] p-0">
        <Command filter={filter}>
          <CommandInput placeholder="Search..." className="h-9" />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Customers">
              {customerItems.map(({ value: itemValue, label, subLabel, keywords }) => (
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
              ))}
            </CommandGroup>
            <CommandGroup heading="Bookings">
              {bookingItems.map(({ value: itemValue, label, subLabel, keywords }) => (
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
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
