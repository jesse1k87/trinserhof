import React from 'react';

export const Error = ({ message }: { message: string }) => (
  <div
    role="alert"
    className="bg-destructive/10 border border-destructive/40 text-xs text-destructive px-4 py-3 rounded relative"
  >
    <span className="block sm:inline">{message}</span>
  </div>
);
