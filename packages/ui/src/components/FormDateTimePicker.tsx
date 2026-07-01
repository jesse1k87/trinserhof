import * as React from 'react';
import { Button } from '@trinserhof/ui';
import { Calendar } from '@trinserhof/ui';
import { ICONS } from '../icons';
import { format } from 'date-fns';
import { Input } from '@trinserhof/ui';
import { Popover, PopoverContent, PopoverTrigger } from '@trinserhof/ui';

const setTimeOnDate = (date: Date, time: string) => {
  const [hours, minutes] = time.split(':').map(Number);
  const updated = new Date(date);
  updated.setHours(hours, minutes, 0, 0);
  return updated;
};

export const FormDateTimePicker = ({
  initialValue,
  disabled = true,
  onChange,
}: {
  initialValue: Date | undefined;
  disabled: boolean;
  onChange: (date: Date) => void;
}) => {
  const [date, setDate] = React.useState<Date | undefined>(initialValue);

  const dateFormat = 'LLL d, y';

  return (
    <div className="flex flex-row gap-2 w-full">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            disabled={disabled}
            className="flex-1 justify-start text-left font-normal"
          >
            <ICONS.calendar className="mr-2 h-4 w-4" />
            {date ? format(date, dateFormat) : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="single"
            defaultMonth={date}
            selected={date}
            onSelect={(newDate: Date | undefined) => {
              if (!newDate) return;
              const updated = date ? setTimeOnDate(newDate, format(date, 'HH:mm')) : newDate;
              setDate(updated);
              onChange(updated);
            }}
          />
        </PopoverContent>
      </Popover>
      <Input
        type="time"
        className="w-32"
        disabled={disabled}
        value={date ? format(date, 'HH:mm') : ''}
        onChange={(event) => {
          if (!date || !event.target.value) return;
          const updated = setTimeOnDate(date, event.target.value);
          setDate(updated);
          onChange(updated);
        }}
      />
    </div>
  );
};
