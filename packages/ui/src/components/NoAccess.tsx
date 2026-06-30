import React from 'react';
import { ICONS } from '../icons';

export const NoAccess = ({
  message = 'You do not have permission to access this page.',
}: {
  message?: string;
}) => (
  <div
    role="alert"
    className="flex flex-col items-center justify-center gap-2 text-center text-muted-foreground p-8"
  >
    <ICONS.noAccess className="size-10 text-destructive" />
    <span className="text-sm">{message}</span>
  </div>
);
