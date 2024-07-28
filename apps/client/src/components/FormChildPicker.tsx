import * as React from 'react';
import { NumberPicker } from './NumberPicker';

export const FormChildPicker = ({
  amount,
  set,
}: {
  amount: number;
  set: (amount: number) => void;
}) => {
  return (
    <NumberPicker
      label="Amount of children"
      sublabel="Ages 2–15"
      initialAmount={amount}
      onChange={(newValue) => set(newValue)}
    />
  );
};
