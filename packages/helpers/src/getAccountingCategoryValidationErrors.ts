import { AccountingCategory, TAX_RATES } from '@trinserhof/types';

export const REQUIRED_ACCOUNTING_CATEGORY_FIELD_TYPES: Record<string, 'string' | 'number'> = {
  id: 'string',
  name: 'string',
  taxRate: 'number',
};

export const getAccountingCategoryValidationErrors = (category: AccountingCategory): string[] => {
  const errors = Object.entries(REQUIRED_ACCOUNTING_CATEGORY_FIELD_TYPES).reduce<string[]>(
    (errors, [field, type]) => {
      const value = (category as Record<string, unknown>)[field];
      if (value === undefined || value === null || value === '') {
        errors.push(`${field} is missing`);
      } else if (typeof value !== type) {
        errors.push(`${field} must be a ${type} (got ${typeof value})`);
      }
      return errors;
    },
    [],
  );

  if (
    category.taxRate !== undefined &&
    !(TAX_RATES as readonly number[]).includes(category.taxRate)
  ) {
    errors.push(`taxRate must be one of ${TAX_RATES.join(', ')}`);
  }

  return errors;
};
