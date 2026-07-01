'use client';

import * as React from 'react';
import { ICONS } from '../icons';
import { DayPicker } from 'react-day-picker';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({ className, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={`react-day-picker p-3 ${className || ''}`.trim()}
      components={{
        IconLeft: () => <ICONS.chevronLeft className="h-4 w-4" />,
        IconRight: () => <ICONS.chevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  );
}
Calendar.displayName = 'Calendar';

export { Calendar };
