import * as React from 'react';
import { AccountingCategory, canPerform, TAX_RATES, type TaxRate, User } from '@trinserhof/types';
import { accountingCategoriesAreDifferent, getNewAccountingCategory } from '@trinserhof/helpers';
import { type Page } from 'src/types/page';
import {
  ICONS,
  Button,
  ColorPicker,
  Input,
  PageHeader,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SmallText,
} from '@trinserhof/ui';
import useAccountingCategories from 'src/hooks/useAccountingCategories';
import { logAuditEvent, saveAccountingCategory } from '@trinserhof/supabase';
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

export const AccountingCategoryDetailPage = ({
  id,
  user,
  navigate,
}: {
  id: string;
  user: User;
  navigate: (page: Page, id?: string) => void;
}) => {
  const isNew = id === 'new';

  const categories = useAccountingCategories();

  const originalCategory = isNew ? undefined : categories.find((c) => c.id === id);

  const [category, setCategory] = React.useState<AccountingCategory | undefined>(() =>
    isNew ? getNewAccountingCategory() : undefined,
  );

  React.useEffect(() => {
    if (!isNew) setCategory(originalCategory);
  }, [isNew, originalCategory]);

  React.useEffect(() => {
    if (!isNew && categories.length > 0 && !originalCategory) {
      navigate('accounting-categories-table');
    }
  }, [isNew, categories.length, originalCategory, navigate]);

  const canCreate = canPerform(user.role, 'ACCOUNTING_CATEGORY', 'CREATE');
  const canUpdate = canPerform(user.role, 'ACCOUNTING_CATEGORY', 'UPDATE');

  if (isNew && !canCreate) return null;
  if (!category) return null;

  const enabled = isNew ? canCreate : canUpdate;
  const hasChanges =
    isNew || (!!originalCategory && accountingCategoriesAreDifferent(originalCategory, category));

  const handleSave = async () => {
    try {
      const saved = await saveAccountingCategory(category);
      logAuditEvent(
        originalCategory ? 'ACCOUNTING_CATEGORY_UPDATED' : 'ACCOUNTING_CATEGORY_CREATED',
        user.email,
      );
      if (isNew) navigate('accounting-categories-table');
      else setCategory(saved);
    } catch (error) {
      toast.error(getSaveErrorMessage(error));
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-2xl px-4 py-6">
      <div className="flex flex-row items-center gap-2">
        <Button
          aria-label="Back to accounting categories"
          className="hover:cursor-pointer"
          onClick={() => navigate('accounting-categories-table')}
        >
          <ICONS.arrowLeft />
        </Button>
        <PageHeader
          icon={<ICONS.accountingCategory className="size-5" />}
          title={isNew ? 'New accounting category' : 'Accounting category'}
        >
          {enabled && hasChanges && <Button onClick={handleSave}>Save</Button>}
        </PageHeader>
      </div>

      <div className="flex flex-col w-full grid gap-1">
        <SmallText className="pt-1">Name</SmallText>
        <Input
          placeholder="Enter a name"
          value={category.name}
          disabled={!enabled}
          onChange={(event) => setCategory({ ...category, name: event.target.value })}
        />
      </div>

      <div className="flex flex-col w-full grid gap-1">
        <div className="pt-1 text-xs text-base-content/60">Tax rate</div>
        <Select
          value={String(category.taxRate)}
          disabled={!enabled}
          onValueChange={(value) => setCategory({ ...category, taxRate: Number(value) as TaxRate })}
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
        <div className="pt-1 text-xs text-base-content/60">Color</div>
        <ColorPicker
          value={category.color}
          disabled={!enabled}
          onChange={(color) => setCategory({ ...category, color })}
        />
      </div>
    </div>
  );
};
