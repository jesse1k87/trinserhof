import React from 'react';
import { Eye as EyeOpenIcon } from 'lucide-react';

export const NoEditingAllowed = () => (
  <div className="flex gap-2 align-cener justify-center content-center text-xs font-mono text-muted-foreground">
    <EyeOpenIcon className="size-4" /> View-only (no editing)
  </div>
);
