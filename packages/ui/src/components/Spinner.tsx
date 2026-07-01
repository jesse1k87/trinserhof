import * as React from 'react';
import { LoadingIcon } from '../icons';

const Loader2 = LoadingIcon;

export type SpinnerProps = React.ComponentProps<typeof Loader2>;

export const Spinner = ({ className, ...props }: SpinnerProps) => (
  <Loader2
    role="status"
    aria-label="Loading"
    className={`animate-spin ${className ?? ''}`.trim()}
    {...props}
  />
);
