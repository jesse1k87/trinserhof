import { ProductCategory, TAX_RATES } from '@trinserhof/types';

// Mirrors the field requirements enforced by productCategories/$categoryId/.validate in
// database.rules.json, so a rejected write can be reported back with the specific field(s)
// that failed instead of just "PERMISSION_DENIED".
export const REQUIRED_PRODUCT_CATEGORY_FIELD_TYPES: Record<string, 'string' | 'number'> = {
  id: 'string',
  name: 'string',
  taxRate: 'number',
};

export const getProductCategoryValidationErrors = (category: ProductCategory): string[] => {
  const errors = Object.entries(REQUIRED_PRODUCT_CATEGORY_FIELD_TYPES).reduce<string[]>(
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
