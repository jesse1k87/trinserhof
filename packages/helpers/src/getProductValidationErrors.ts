import { Product } from '@trinserhof/types';

// Mirrors the field requirements enforced by products/$productId/.validate in database.rules.json,
// so a rejected write can be reported back with the specific field(s) that failed instead of just "PERMISSION_DENIED".
export const REQUIRED_PRODUCT_FIELD_TYPES: Record<string, 'string' | 'number'> = {
  accountingCategoryId: 'string',
  id: 'string',
  name: 'string',
  price: 'number',
};

export const getProductValidationErrors = (product: Product): string[] => {
  const errors = Object.entries(REQUIRED_PRODUCT_FIELD_TYPES).reduce<string[]>(
    (errors, [field, type]) => {
      const value = (product as Record<string, unknown>)[field];
      if (value === undefined || value === null || value === '') {
        errors.push(`${field} is missing`);
      } else if (typeof value !== type) {
        errors.push(`${field} must be a ${type} (got ${typeof value})`);
      }
      return errors;
    },
    [],
  );

  product.variants?.forEach((variant, index) => {
    if (!variant.name || !variant.name.trim()) {
      errors.push(`variant ${index + 1} name is missing`);
    }
    if (typeof variant.price !== 'number') {
      errors.push(`variant ${index + 1} price must be a number (got ${typeof variant.price})`);
    }
  });

  return errors;
};
