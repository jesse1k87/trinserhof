import * as React from 'react';

import {
  Select as ShadCnSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function Select({
  selected,
  options,
  onChange,
}: {
  selected: string;
  options: Array<{ value: string; label: string; description: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <ShadCnSelect defaultValue={selected} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
            className="content-start justify-start"
          >
            <div>{option.label}</div>
            {/* <div className="flex flex-wrap max-w-32 font-xs text-gray-400">
              {option.description}
            </div> */}
          </SelectItem>
        ))}
      </SelectContent>
    </ShadCnSelect>
  );
}
