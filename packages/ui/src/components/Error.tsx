import React from 'react';

export const Error = ({ message }: { message: string }) => (
  <div
    role="alert"
    className="bg-error/10 border border-error/40 text-xs text-error px-4 py-3 rounded relative"
  >
    <span className="block sm:inline">{message}</span>
  </div>
);
