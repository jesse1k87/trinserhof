'use client';

import * as React from 'react';
import { CaretSortIcon, CheckIcon } from '@radix-ui/react-icons';

import { cn } from '@bookings/ui';
import { Button } from '@bookings/ui';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@bookings/ui';
import { Popover, PopoverContent, PopoverTrigger } from '@bookings/ui';
import { Booking } from '@bookings/types';
import { BookingContext } from 'src/context/BookingContext';
import useCollection from 'src/hooks/useCollection';
import { format } from 'date-fns';

export function SearchBox() {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState('');

  const [booking, setBooking] = React.useContext(BookingContext);
  const bookings = useCollection('bookings');

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-max justify-between"
        >
          {value ? bookings.find((booking: Booking) => booking.id === value)?.name : 'Search...'}
          <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-max mx-2 p-0">
        <Command
          filter={(value, search, keywords) => {
            const extendValue = `${value} ${keywords && keywords.join(' ')}`.toLowerCase();
            if (extendValue.includes(search.toLowerCase())) return 1;
            return 0;
          }}
        >
          <CommandInput placeholder="Search..." className="h-9" />
          <CommandList>
            <CommandEmpty>No bookings found.</CommandEmpty>
            <CommandGroup>
              {bookings.map(({ id, name, notes, email, checkIn, roomId }) => {
                const label: string[] = [];
                if (typeof roomId === 'string') label.push(`${roomId}.`);
                if (typeof name === 'string') label.push(name);
                if (typeof checkIn === 'string') label.push(`(${format(checkIn, 'LLL d, y')})`);

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

                return (
                  <CommandItem
                    key={id}
                    value={id}
                    keywords={keywords}
                    onSelect={(currentValue) => {
                      setValue(currentValue === value ? '' : currentValue);
                      const selectedBooking = bookings?.find((b) => b?.id === currentValue);
                      setBooking(selectedBooking);
                      setOpen(false);
                    }}
                  >
                    <div>
                      {label.join(' ')}
                      {subLabel.length > 0 && (
                        <div className="text-xs text-gray-400">{subLabel.join(' ')}</div>
                      )}
                    </div>
                    <CheckIcon
                      className={cn('ml-auto h-4 w-4', value === id ? 'opacity-100' : 'opacity-0')}
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
}
