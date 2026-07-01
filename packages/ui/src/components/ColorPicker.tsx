import * as React from 'react';
import { HEX_COLOR_REGEX } from '@trinserhof/types';
import { Input } from './input';

export const ColorPicker = ({
  value,
  onChange,
  disabled,
  className,
}: {
  value: string;
  onChange: (color: string) => void;
  disabled?: boolean;
  className?: string;
}) => {
  const isValidHex = HEX_COLOR_REGEX.test(value);

  return (
    <div className={`flex items-center gap-2 ${className ?? ''}`.trim()}>
      <input
        type="color"
        aria-label="Pick a color"
        value={isValidHex ? value : '#000000'}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 w-9 shrink-0 cursor-pointer rounded border border-base-300 p-1 disabled:cursor-not-allowed"
      />
      <Input
        value={value}
        placeholder="#3b82f6"
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="font-mono"
      />
    </div>
  );
};
