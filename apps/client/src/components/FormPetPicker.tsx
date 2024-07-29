import * as React from 'react';
import { NumberPicker } from './NumberPicker';
import { formatCurrency } from '@bookings/helpers';
import { petPricePerNight } from '@bookings/types';

export const FormPetPicker = ({
  amount,
  set,
}: {
  amount: number;
  set: (amount: number) => void;
}) => {
  return (
    <NumberPicker
      label="Amount of pets"
      sublabel={`${formatCurrency(petPricePerNight)} p.p.p.n.`}
      amount={amount}
      maxAmount={3}
      onChange={(newValue) => set(newValue)}
    />
  );
};
