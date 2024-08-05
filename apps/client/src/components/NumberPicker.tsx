import * as React from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { MinusIcon, PlusIcon } from '@radix-ui/react-icons';

export const NumberPicker = ({
  label,
  sublabel,
  initialAmount,
  minAmount = 0,
  maxAmount = 8,
  onChange,
}: {
  label: string;
  sublabel?: string;
  initialAmount: number;
  minAmount?: number;
  maxAmount?: number;
  onChange: (newAmount: number) => void;
}) => {
  const [amount, setAmount] = React.useState<number>(initialAmount);

  const decrease = () => {
    const newAmount = amount - 1;
    if (newAmount >= minAmount) {
      onChange(newAmount);
      setAmount(newAmount);
    }
  };
  const increase = () => {
    const newAmount = amount + 1;
    if (newAmount <= maxAmount) {
      onChange(newAmount);
      setAmount(newAmount);
    }
  };

  return (
    <div className="grid items-center justify-items-end gap-4 grid-cols-2">
      <div className="flex w-full flex-col">
        <Label htmlFor="label">{label}</Label>
        <div className="pt-1 text-xs text-gray-500">{sublabel}</div>
      </div>
      <div className="grid grid-cols-3 gap-2 flex justify-end w-max">
        <div className="flex justify-center items-center">
          <Button
            variant="outline"
            size="icon"
            className="rounded-full"
            onClick={decrease}
            // disabled={amount <= minAmount - 2}
          >
            <MinusIcon className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex justify-center items-center">{amount}</div>
        <div className="flex justify-center items-center">
          <Button
            variant="outline"
            size="icon"
            className="rounded-full"
            onClick={increase}
            // disabled={amount >= maxAmount}
          >
            <PlusIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
