import * as React from 'react';
import { Button, cn } from '@trinserhof/ui';
import type { FilterOption } from 'src/hooks/useToggleFilter';

interface FilterBarProps<T extends string> {
  options: readonly FilterOption<T>[];
  selected: readonly T[];
  onToggle: (value: T) => void;
  className?: string;
}

/**
 * Row of toggle chips backing the shared multi-select filter (see
 * `useToggleFilter`). An active chip means the value is included in the
 * results; clicking toggles it.
 */
export function FilterBar<T extends string>({
  options,
  selected,
  onToggle,
  className,
}: FilterBarProps<T>) {
  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {options.map(({ value, label }) => {
        const isSelected = selected.includes(value);
        return (
          <Button
            key={value}
            type="button"
            size="sm"
            variant={isSelected ? 'default' : 'outline'}
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
