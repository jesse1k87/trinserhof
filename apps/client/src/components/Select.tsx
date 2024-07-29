import * as React from 'react';
import { RoomType } from '@bookings/types';
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
  options: Array<{ value: string; label: string; description?: string }>;
  onChange: (value: RoomType) => void;
}) {
  return (
    <ShadCnSelect defaultValue={selected} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
            {option.description && (
              <div className="text-xs text-gray-400">{option.description}</div>
            )}
          </SelectItem>
        ))}
      </SelectContent>
    </ShadCnSelect>
  );
}
