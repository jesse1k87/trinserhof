import React from 'react';
import { NoAccessIcon } from '../icons';

export const NoAccess = ({
  message = 'You do not have permission to access this page.',
}: {
  message?: string;
}) => (
  <div
    role="alert"
    className="flex flex-col items-center justify-center gap-2 text-center text-base-content/60 p-8"
  >
    <NoAccessIcon className="size-10 text-error" />
    <span className="text-sm">{message}</span>
  </div>
);
