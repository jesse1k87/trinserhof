import * as React from 'react';

import { cn } from '../lib/utils';

export interface StatusIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
  /** CSS color value (e.g. a hex code or `var(--color-orange-400)`) for the dot. */
  color: string;
  /** Optional label. When omitted, the pill collapses into a circle around the dot. */
  label?: string;
  /** Extra classes for the dot itself, e.g. to swap a solid fill for a dashed/outline style. */
  dotClassName?: string;
}

export const StatusIndicator = ({
  color,
  label,
  className,
  dotClassName,
  ...props
}: StatusIndicatorProps) => {
  return (
    <div
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-full border border-base-300 text-xs font-medium',
        label ? 'gap-1.5 px-2.5 py-1' : 'size-5',
        className,
      )}
      {...props}
    >
      <span
        className={cn('size-2 shrink-0 rounded-full', dotClassName)}
        style={{ backgroundColor: color }}
      />
      {label}
    </div>
  );
};
