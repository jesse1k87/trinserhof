import * as React from 'react';
import { canPerform, TAX_RATES, type TaxRate, User } from '@trinserhof/types';
import { AccountingCategoryContext } from 'src/context/AccountingCategoryContext';
import { accountingCategoriesAreDifferent } from '@trinserhof/helpers';
import { Button } from '@trinserhof/ui/src/components/button';
import { Sheet, SheetContent, SheetTitle } from '@trinserhof/ui/src/components/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@trinserhof/ui/src/components/select';
import useAccountingCategories from 'src/hooks/useAccountingCategories';
import { Input } from '@trinserhof/ui/src/components/input';
import { ColorPicker } from '@trinserhof/ui/src/components/ColorPicker';
import { logAuditEvent, saveAccountingCategory } from '@trinserhof/supabase-db';
import { toast } from 'sonner';

const getSaveErrorMessage = (error: unknown) => {
  if (error instanceof Error && error.message.startsWith('Invalid accounting category data:')) {
    return `This accounting category could not be saved: ${error.message.replace('Invalid accounting category data: ', '')}`;
  }
  if (error instanceof Error && error.message.includes('PERMISSION_DENIED')) {
    return 'This accounting category is invalid and could not be saved. Please check all required fields.';
  }
  return 'Something went wrong while saving the accounting category.';
};

export const AccountingCategoryDetails = ({ user }: { user: User }) => {
  const [category, setCategory] = React.useContext(AccountingCategoryContext);

  const categories = useAccountingCategories();

  const originalCategory = categories?.find((c) => c.id === category?.id);

  const [hasChanges, setHasChanges] = React.useState<boolean>(!originalCategory);

  React.useEffect(() => {
    if (!category) return;
    setHasChanges(
      Boolean(!originalCategory || accountingCategoriesAreDifferent(originalCategory, category)),
    );
  }, [category, categories]);

  if (!category) return null;

  if (!user) return null;

  const enabled = canPerform(user.role, 'ACCOUNTING_CATEGORY', 'UPDATE');

  return (
    <Sheet open onOpenChange={(open) => !open && setCategory(null)}>
      <SheetContent
        side="right"
        onOpenAutoFocus={(event) => event.preventDefault()}
        className="flex flex-col grid gap-4 grid-cols-1 content-start overflow-y-auto p-6 pb-12"
      >
        <SheetTitle className="sr-only">Accounting category details</SheetTitle>

        <div className="flex flex-col w-full grid gap-1">
          <div className="pt-1 text-xs text-muted-foreground">Name</div>
          <Input
            placeholder="Enter a name"
            value={category.name}
            disabled={!enabled}
            onChange={(event) => setCategory({ ...category, name: event.target.value })}
          />
        </div>

        <div className="flex flex-col w-full grid gap-1">
          <div className="pt-1 text-xs text-muted-foreground">Tax rate</div>
          <Select
            value={String(category.taxRate)}
            disabled={!enabled}
            onValueChange={(value) =>
              setCategory({ ...category, taxRate: Number(value) as TaxRate })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TAX_RATES.map((taxRate) => (
                <SelectItem key={taxRate} value={String(taxRate)}>
                  {taxRate}%
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col w-full grid gap-1">
          <div className="pt-1 text-xs text-muted-foreground">Color</div>
          <ColorPicker
            value={category.color}
            disabled={!enabled}
            onChange={(color) => setCategory({ ...category, color })}
          />
        </div>

        {canPerform(user.role, 'ACCOUNTING_CATEGORY', 'UPDATE') && (
          <div className="flex flex-row justify-between w-full">
            {hasChanges && (
              <div className="flex flex-row justify-end">
                <Button
                  variant="outline"
                  className="mr-2"
                  onClick={() => setCategory(originalCategory ?? null)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    try {
                      setCategory(await saveAccountingCategory(category));
                      logAuditEvent(
                        originalCategory
                          ? 'ACCOUNTING_CATEGORY_UPDATED'
                          : 'ACCOUNTING_CATEGORY_CREATED',
                        user.email,
                      );
                    } catch (error) {
                      toast.error(getSaveErrorMessage(error));
                    }
                  }}
                >
                  Save
                </Button>
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
