import * as React from 'react';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

export const Toaster = (props: ToasterProps) => (
  <Sonner
    theme="light"
    className="toaster group"
    toastOptions={{
      classNames: {
        toast:
          'group toast group-[.toaster]:bg-base-100 group-[.toaster]:text-base-content group-[.toaster]:border-base-300 group-[.toaster]:shadow-lg',
        description: 'group-[.toast]:text-base-content/60',
        actionButton: 'group-[.toast]:bg-primary group-[.toast]:text-primary-content',
        cancelButton: 'group-[.toast]:bg-base-200 group-[.toast]:text-base-content/60',
      },
    }}
    {...props}
  />
);
