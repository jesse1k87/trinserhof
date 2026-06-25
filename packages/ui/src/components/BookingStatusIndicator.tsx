import * as React from 'react';
import { STATUSES, type Status } from '@trinserhof/types';

import { cn } from '../lib/utils';

export interface BookingStatusIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
  status: Status;
}

export const BookingStatusIndicator = ({
  status,
  className,
  ...props
}: BookingStatusIndicatorProps) => {
  const label = STATUSES.find((s) => s.id === status)?.label ?? status;

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border border-base-300 px-2.5 py-1 text-xs font-medium',
        className,
      )}
      {...props}
    >
      <span className={`booking-status-dot status-${status}`} />
      {label}
    </div>
  );
};
