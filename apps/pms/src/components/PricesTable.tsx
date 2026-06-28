import * as React from 'react';
import {
  Button,
  Input,
  PageHeader,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  cn,
} from '@trinserhof/ui';
import { canPerform, type RoomTypeId, type User } from '@trinserhof/types';
import { formatCurrency, getYYYYmmDD } from '@trinserhof/helpers';
import { PriceIcon, ChevronLeftIcon, ChevronRightIcon, ResetIcon } from '@trinserhof/ui';
import {
  logAuditEvent,
  saveBasePrice,
  savePriceOverride,
  deletePriceOverride,
} from '@trinserhof/supabase';
import usePrices from 'src/hooks/usePrices';
import useRoomTypes from 'src/hooks/useRoomTypes';
import { toast } from 'sonner';

const getSaveErrorMessage = (error: unknown) => {
  if (error instanceof Error && error.message.startsWith('Invalid price data:')) {
    return `This price could not be saved: ${error.message.replace('Invalid price data: ', '')}`;
  }
  if (error instanceof Error && error.message.includes('PERMISSION_DENIED')) {
    return 'You do not have permission to change prices.';
  }
  return 'Something went wrong while saving the price.';
};

// Parses a price input, returning a non-negative number or null if invalid/empty.
const parsePrice = (value: string): number | null => {
  const trimmed = value.trim();
  if (trimmed === '') return null;
  const num = Number(trimmed);
  return Number.isFinite(num) && num >= 0 ? num : null;
};

const BasePriceInput = ({
  label,
  value,
  disabled,
  onSave,
}: {
  label: string;
  value: number | undefined;
  disabled: boolean;
  onSave: (price: number) => void;
}) => {
  const [draft, setDraft] = React.useState<string>(value != null ? String(value) : '');

  React.useEffect(() => {
    setDraft(value != null ? String(value) : '');
  }, [value]);

  const commit = () => {
    const parsed = parsePrice(draft);
    if (parsed === null) {
      setDraft(value != null ? String(value) : '');
      return;
    }
    if (parsed === value) return;
    onSave(parsed);
  };

  return (
    <div className="flex flex-row items-center justify-between gap-3 rounded-md border px-3 py-2">
      <span className="text-sm">{label}</span>
      <div className="flex flex-row items-center gap-2">
        <Input
          type="number"
          inputMode="decimal"
          min={0}
          step="any"
          aria-label={`Base price for ${label}`}
          placeholder="Not set"
          value={draft}
          disabled={disabled}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === 'Enter') event.currentTarget.blur();
          }}
          className="h-9 w-28 text-right"
        />
        <span className="text-xs text-muted-foreground whitespace-nowrap">/ night</span>
      </div>
    </div>
  );
};

const PriceCell = ({
  base,
  override,
  disabled,
  onSetOverride,
  onClearOverride,
}: {
  base: number | undefined;
  override: number | undefined;
  disabled: boolean;
  onSetOverride: (price: number) => void;
  onClearOverride: () => void;
}) => {
  const hasOverride = typeof override === 'number';
  const effective = hasOverride ? override : base;

  const [draft, setDraft] = React.useState<string>(effective != null ? String(effective) : '');

  React.useEffect(() => {
    setDraft(effective != null ? String(effective) : '');
  }, [effective]);

  if (disabled) {
    return (
      <span className={hasOverride ? 'font-medium text-primary' : 'text-muted-foreground'}>
        {effective != null ? formatCurrency(effective) : '—'}
      </span>
    );
  }

  const commit = () => {
    const parsed = parsePrice(draft);
    if (parsed === null) {
      // Empty clears an existing override; otherwise restore the shown value.
      if (draft.trim() === '' && hasOverride) {
        onClearOverride();
      } else {
        setDraft(effective != null ? String(effective) : '');
      }
      return;
    }
    // Matching the base price means "no override" - clear any existing one.
    if (base != null && parsed === base) {
      if (hasOverride) onClearOverride();
      return;
    }
    if (hasOverride && parsed === override) return;
    onSetOverride(parsed);
  };

  return (
    <div className="flex flex-row items-center justify-end gap-1">
      <Input
        type="number"
        inputMode="decimal"
        min={0}
        step="any"
        placeholder={base != null ? String(base) : '—'}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') event.currentTarget.blur();
        }}
        className={cn(
          'h-8 w-24 text-right',
          hasOverride && 'border-primary text-primary font-medium',
        )}
      />
      <Button
        size="icon"
        variant="ghost"
        aria-label="Reset to base price"
        title="Reset to base price"
        className={cn('h-7 w-7 shrink-0', !hasOverride && 'invisible')}
        onClick={onClearOverride}
      >
        <ResetIcon className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
};

export const PricesTable = ({ user }: { user: User }) => {
  const prices = usePrices();
  const roomTypes = useRoomTypes();
  const canEdit = canPerform(user.role, 'PRICE', 'UPDATE');

  const [viewMonth, setViewMonth] = React.useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const monthLabel = viewMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const days = React.useMemo(() => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, index) => {
      const date = new Date(year, month, index + 1);
      return {
        key: getYYYYmmDD(date),
        label: date.toLocaleDateString('en-US', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
        }),
        isWeekend: date.getDay() === 0 || date.getDay() === 6,
      };
    });
  }, [viewMonth]);

  const shiftMonth = (delta: number) =>
    setViewMonth((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));

  const handleSaveBase = async (roomType: RoomTypeId, price: number) => {
    try {
      await saveBasePrice(roomType, price);
      logAuditEvent('PRICE_BASE_UPDATED', user.email);
    } catch (error) {
      toast.error(getSaveErrorMessage(error));
    }
  };

  const handleSetOverride = async (date: string, roomType: RoomTypeId, price: number) => {
    try {
      await savePriceOverride(date, roomType, price);
      logAuditEvent('PRICE_OVERRIDE_SET', user.email);
    } catch (error) {
      toast.error(getSaveErrorMessage(error));
    }
  };

  const handleClearOverride = async (date: string, roomType: RoomTypeId) => {
    try {
      await deletePriceOverride(date, roomType);
      logAuditEvent('PRICE_OVERRIDE_REMOVED', user.email);
    } catch (error) {
      toast.error(getSaveErrorMessage(error));
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl px-4 py-6">
      <PageHeader icon={<PriceIcon className="size-5" />} title="Prices" />

      <section className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-sm font-medium">Base prices per night</h2>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {roomTypes.map(({ id, label }) => (
            <BasePriceInput
              key={id}
              label={label}
              value={prices.base?.[id]}
              disabled={!canEdit}
              onSave={(price) => handleSaveBase(id, price)}
            />
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex flex-row items-center justify-between">
          <div className="flex flex-col gap-1">
            <h2 className="text-sm font-medium">Price adjustments</h2>
          </div>
          <div className="flex flex-row items-center gap-1">
            <Button
              size="icon"
              variant="outline"
              aria-label="Previous month"
              className="hover:cursor-pointer"
              onClick={() => shiftMonth(-1)}
            >
              <ChevronLeftIcon />
            </Button>
            <span className="min-w-36 text-center text-sm font-medium">{monthLabel}</span>
            <Button
              size="icon"
              variant="outline"
              aria-label="Next month"
              className="hover:cursor-pointer"
              onClick={() => shiftMonth(1)}
            >
              <ChevronRightIcon />
            </Button>
          </div>
        </div>

        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 z-10 bg-background">Room type</TableHead>
                {days.map((day) => (
                  <TableHead
                    key={day.key}
                    className={cn('text-right whitespace-nowrap', day.isWeekend && 'bg-muted/40')}
                  >
                    {day.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {roomTypes.map(({ id, label }) => (
                <TableRow key={id}>
                  <TableCell className="sticky left-0 z-10 bg-background whitespace-nowrap font-medium">
                    {label}
                  </TableCell>
                  {days.map((day) => (
                    <TableCell
                      key={day.key}
                      className={cn('text-right', day.isWeekend && 'bg-muted/40')}
                    >
                      <PriceCell
                        base={prices.base?.[id]}
                        override={prices.overrides?.[day.key]?.[id]}
                        disabled={!canEdit}
                        onSetOverride={(price) => handleSetOverride(day.key, id, price)}
                        onClearOverride={() => handleClearOverride(day.key, id)}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
};
