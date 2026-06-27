import * as React from 'react';
import { SpinnerIcon as Loader2 } from '../icons';
import { cn } from '../lib/utils';

export type SpinnerProps = React.ComponentProps<typeof Loader2>;

export const Spinner = ({ className, ...props }: SpinnerProps) => (
  <Loader2
    role="status"
    aria-label="Loading"
    className={cn('animate-spin', className)}
    {...props}
  />
);
