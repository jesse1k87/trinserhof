import * as React from 'react';
import { Button } from '@trinserhof/ui';
import type { FilterOption } from 'src/hooks/useToggleFilter';

interface FilterBarProps<T extends string> {
  options: readonly FilterOption<T>[];
  selected: readonly T[];
  onToggle: (value: T) => void;
  className?: string;
}

export function FilterBar<T extends string>({ options, selected, onToggle }: FilterBarProps<T>) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {options.map(({ value, label }) => {
        const isSelected = selected.includes(value);
        return (
          <Button
            key={value}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onToggle(value)}
            className="hover:cursor-pointer"
          >
            {label}
          </Button>
        );
      })}
    </div>
  );
}
