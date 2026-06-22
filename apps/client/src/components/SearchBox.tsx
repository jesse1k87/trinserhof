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
import { Booking } from '@trinserhof/types';
import { BookingContext } from 'src/context/BookingContext';
import { TimelineContext } from 'src/context/TimelineContext';
import useCollection from 'src/hooks/useCollection';
import { removeTimeFromDate } from '@trinserhof/helpers';
import { format } from 'date-fns';

type SearchItem = {
  id: string;
  label: string;
  subLabel: string;
  keywords: string[];
};

export function SearchBox() {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState('');

  const [, setBooking] = React.useContext(BookingContext);
  const timelineRef = React.useContext(TimelineContext);
  const bookings = useCollection('bookings');

  // Precompute per-booking labels and a lowercased search blob once per `bookings`
  // update, instead of on every render and every keystroke (cmdk calls `filter`
  // for every item on every keystroke).
  const { items, searchTextById } = React.useMemo(() => {
    const searchTextById = new Map<string, string>();
    const items: SearchItem[] = bookings.map(({ id, name, notes, email, checkIn, roomId }) => {
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

      searchTextById.set(id, `${id} ${keywords.join(' ')}`.toLowerCase());

      return { id, label: label.join(' '), subLabel: subLabel.join(' '), keywords };
    });

    return { items, searchTextById };
  }, [bookings]);

  const filter = React.useCallback(
    (itemValue: string, search: string) =>
      searchTextById.get(itemValue)?.includes(search.toLowerCase()) ? 1 : 0,
    [searchTextById],
  );

  const selectedBooking = React.useMemo(
    () => bookings.find((booking: Booking) => booking.id === value),
    [bookings, value],
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-max justify-between"
        >
          {value ? selectedBooking?.name : 'Search...'}
          <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-max mx-2 p-0">
        <Command filter={filter}>
          <CommandInput placeholder="Search..." className="h-9" />
          <CommandList>
            <CommandEmpty>No bookings found.</CommandEmpty>
            <CommandGroup>
              {items.map(({ id, label, subLabel, keywords }) => (
                <CommandItem
                  key={id}
                  value={id}
                  keywords={keywords}
                  onSelect={(currentValue) => {
                    setValue(currentValue === value ? '' : currentValue);
                    const selectedBooking = bookings?.find((b) => b?.id === currentValue);
                    setBooking(selectedBooking ?? null);
                    if (selectedBooking) {
                      const checkInDate = removeTimeFromDate(selectedBooking.checkIn);
                      if (checkInDate) timelineRef.current?.moveTo(checkInDate);
                    }
                    setOpen(false);
                  }}
                >
                  <div>
                    {label}
                    {subLabel.length > 0 && <div className="text-xs text-gray-400">{subLabel}</div>}
                  </div>
                  <CheckIcon
                    className={cn('ml-auto h-4 w-4', value === id ? 'opacity-100' : 'opacity-0')}
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
