'use client';

import * as React from 'react';
import { CalendarIcon } from '@radix-ui/react-icons';
import { format } from 'date-fns';
import { cn } from 'src/@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { getYYYYmmDD, removeTimeFromDate } from '@bookings/helpers';
import { BookingContext } from 'src/context/BookingContext';
import { DateRange } from 'react-day-picker';

export const DateRangePicker = () => {
  const [booking, setBooking] = React.useContext(BookingContext);
  if (!booking) return null;

  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(undefined);

  React.useEffect(() => {
    setDateRange({
      from: removeTimeFromDate(booking.checkIn),
      to: removeTimeFromDate(booking.checkOut),
    });
  }, [booking]);

  const disabledDates: string[] = [];

  const dateFormat = 'LLL d, y';

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          id="date"
          variant={'outline'}
          className={cn(
            'w-max flex justify-end text-left font-normal',
            !dateRange && 'text-muted-foreground',
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {dateRange?.from ? (
            dateRange.to ? (
              <>
                {format(dateRange.from, dateFormat)} - {format(dateRange.to, dateFormat)}
              </>
            ) : (
              format(dateRange.from, dateFormat)
            )
          ) : (
            <span>Pick a date</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          initialFocus
          mode="range"
          defaultMonth={dateRange?.from}
          selected={dateRange}
          onSelect={(newDateRange: DateRange | undefined) => {
            setBooking({
              ...booking,
              ...(newDateRange?.from && { checkIn: getYYYYmmDD(newDateRange.from) }),
              ...(newDateRange?.to && { checkOut: getYYYYmmDD(newDateRange.to) }),
            });
          }}
          numberOfMonths={2}
          disabled={(date) => date < new Date() || disabledDates.includes(date.toDateString())}
        />
      </PopoverContent>
    </Popover>
  );
};
