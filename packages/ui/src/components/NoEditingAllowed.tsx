import React from 'react';
import { EyeOpenIcon } from '@radix-ui/react-icons';

export const NoEditingAllowed = () => (
  <div className="flex gap-2 align-cener justify-center content-center text-xs font-mono text-gray-400">
    <EyeOpenIcon /> View-only (no editing)
  </div>
);
