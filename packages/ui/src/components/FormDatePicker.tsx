import * as React from 'react';
import { Button } from '@trinserhof/ui';
import { Calendar } from '@trinserhof/ui';
import { CalendarIcon } from '@radix-ui/react-icons';
import { cn } from '@trinserhof/ui';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { getAmountOfNightsFromDateRange } from '@trinserhof/helpers';
import { Popover, PopoverContent, PopoverTrigger } from '@trinserhof/ui';

export const FormDatePicker = ({
  initialFrom = undefined,
  initialTo = undefined,
  disabled = true,
  onChange,
}: {
  initialFrom: DateRange['from'];
  initialTo: DateRange['to'];
  disabled: boolean;
  onChange: (dateRange: DateRange | undefined) => void;
}) => {
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(
    initialFrom && initialTo ? { from: initialFrom, to: initialTo } : undefined,
  );

  React.useEffect(() => {
    onChange(dateRange);
  }, [dateRange]);

  const disabledDates: string[] = [];

  const dateFormat = 'LLL d, y';

  const nights =
    dateRange?.from && dateRange?.to
      ? getAmountOfNightsFromDateRange({
          from: new Date(dateRange.from),
          to: new Date(dateRange.to),
        })
      : 0;

  return (
    <div className="flex flex-col w-full items-center">
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
      <div className="ml-2 text-sm text-muted-foreground mt-2">
        {nights} {nights === 1 ? 'night' : 'nights'}
      </div>
    </div>
  );
};
