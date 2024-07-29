import * as React from 'react';
import { NumberPicker } from './NumberPicker';

export const FormAdultPicker = ({
  amount,
  set,
}: {
  amount: number;
  set: (amount: number) => void;
}) => {
  return (
    <NumberPicker label="Amount of adults" sublabel="Age 16+" amount={amount} onChange={set} />
  );
};
