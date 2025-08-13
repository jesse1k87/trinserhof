import React from 'react';

export const Error = ({ message }: { message: string }) => (
  <div
    role="alert"
    className="bg-red-100 border border-red-400 text-xs text-red-700 px-4 py-3 rounded relative"
  >
    <span className="block sm:inline">{message}</span>
  </div>
);
