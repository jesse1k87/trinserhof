import * as React from 'react';
import { Label } from '@trinserhof/ui';
import { Button } from '@trinserhof/ui';
import { SmallText } from '@trinserhof/ui';
import { ICONS } from '../icons';

export const NumberPicker = ({
  label,
  sublabel,
  initialAmount,
  minAmount = 0,
  maxAmount = 8,
  enabled = false,
  onChange,
}: {
  label: React.ReactNode;
  sublabel?: string;
  initialAmount: number;
  minAmount?: number;
  maxAmount?: number;
  enabled: boolean;
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

  React.useEffect(() => {
    setAmount(initialAmount);
  }, [initialAmount]);

  return (
    <div className="grid items-center justify-items-end gap-4 grid-cols-2">
      <div className="flex w-full flex-col">
        <Label htmlFor="label">{label}</Label>
        <SmallText className="pt-1">{sublabel}</SmallText>
      </div>
      <div className="grid grid-cols-3 gap-2 flex justify-end w-max">
        {enabled && (
          <div className="flex justify-center items-center">
            <Button
              type="button"
              className="rounded-full"
              onClick={decrease}
              disabled={!enabled || amount <= minAmount}
            >
              <ICONS.decrease className="h-4 w-4" />
            </Button>
          </div>
        )}

        <div className="flex justify-center items-center">{amount}</div>

        {enabled && (
          <div className="flex justify-center items-center">
            <Button
              type="button"
              className="rounded-full"
              onClick={increase}
              disabled={!enabled || amount >= maxAmount}
            >
              <ICONS.add className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
