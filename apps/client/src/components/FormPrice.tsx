import * as React from 'react';
import { Label } from '@/components/ui/label';
import { formatCurrency } from '@bookings/helpers';

export const FormPrice = ({ price }: { price: number }) => {
  return (
    <div className="grid items-center justify-items-end gap-4 grid-cols-2">
      <div className="flex w-full">
        <Label className="font-semibold">Total price</Label>
      </div>
      <div className={`flex flex-col font-semibold text-lg ${price === 0 && 'text-gray-400'}`}>
        {formatCurrency(price)}
        <div className="flex justify-end text-xs">excl. VAT </div>
      </div>
    </div>
  );
};
