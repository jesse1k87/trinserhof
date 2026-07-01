import * as React from 'react';
import { ICONS } from '../icons';

const Loader2 = ICONS.loading;

export type SpinnerProps = React.ComponentProps<typeof Loader2>;

export const Spinner = ({ className, ...props }: SpinnerProps) => (
  <Loader2
    role="status"
    aria-label="Loading"
    className={`animate-spin ${className ?? ''}`.trim()}
    {...props}
  />
);
