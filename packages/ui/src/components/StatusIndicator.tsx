import * as React from 'react';

import { cn } from '../lib/utils';

export interface StatusIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
  color: string;
  label?: string;
  dotClassName?: string;
  icon?: React.ReactNode;
}

export const StatusIndicator = ({
  color,
  label,
  icon,
  className,
  dotClassName,
  style,
  ...props
}: StatusIndicatorProps) => {
  return (
    <div
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-full border text-xs font-medium',
        label ? 'gap-1.5 px-2.5 py-1' : 'size-5',
        props.onClick && 'hover:cursor-pointer hover:bg-base-200',
        className,
      )}
      style={{ borderColor: color, color: color, ...style }}
      {...props}
    >
      {icon ? (
        icon
      ) : (
        <span
          className={cn('size-2 shrink-0 rounded-full', dotClassName)}
          style={{ backgroundColor: color }}
        />
      )}
      {label}
    </div>
  );
};
