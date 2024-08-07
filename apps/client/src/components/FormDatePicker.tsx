import * as React from 'react';
import { BookingContext } from 'src/context/BookingContext';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from '@radix-ui/react-icons';
import { cn } from 'src/@/lib/utils';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { getAmountOfNightsFromDateRange } from '@bookings/helpers';
import { getYYYYmmDD } from '@bookings/helpers';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export const FormDatePicker = ({
  disabled = true,
  onChange,
}: {
  disabled: boolean;
  onChange: any;
}) => {
  const [booking, setBooking] = React.useContext(BookingContext);

  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(
    booking?.checkIn && booking?.checkOut
      ? { from: new Date(booking.checkIn), to: new Date(booking.checkOut) }
      : undefined,
  );

  React.useEffect(() => {
    onChange({
      ...booking,
      ...(dateRange?.from && { checkIn: getYYYYmmDD(dateRange.from) }),
      ...(dateRange?.to && { checkOut: getYYYYmmDD(dateRange.to) }),
    });
  }, [dateRange]);

  React.useEffect(() => {
    setDateRange({ from: new Date(booking.checkIn), to: new Date(booking.checkOut) });
  }, [booking.checkIn, booking.checkOut]);

  const disabledDates: string[] = [];

  const dateFormat = 'LLL d, y';

  const nights = getAmountOfNightsFromDateRange({
    from: new Date(booking.checkIn),
    to: new Date(booking.checkOut),
  });

  if (!booking) return null;

  return (
    <div className="flex w-full items-center">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={'outline'}
            disabled={disabled}
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
            onSelect={(newDateRange: DateRange | undefined) => setDateRange(newDateRange)}
            numberOfMonths={2}
            disabled={(date) => disabledDates.includes(date.toDateString())}
          />
        </PopoverContent>
      </Popover>
      <div className="ml-2 text-xs text-gray-500">
        {nights} {nights === 1 ? 'night' : 'nights'}
      </div>
    </div>
  );
};
