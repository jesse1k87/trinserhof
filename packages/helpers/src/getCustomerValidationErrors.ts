import { Customer } from '@trinserhof/types';

// Mirrors the field requirements enforced by customers/$customerId/.validate in database.rules.json,
// so a rejected write can be reported back with the specific field(s) that failed instead of just "PERMISSION_DENIED".
export const REQUIRED_CUSTOMER_FIELD_TYPES: Record<string, 'string'> = {
  id: 'string',
  name: 'string',
  email: 'string',
};

export const getCustomerValidationErrors = (customer: Customer): string[] =>
  Object.entries(REQUIRED_CUSTOMER_FIELD_TYPES).reduce<string[]>((errors, [field, type]) => {
    const value = (customer as Record<string, unknown>)[field];
    if (value === undefined || value === null || value === '') {
      errors.push(`${field} is missing`);
    } else if (typeof value !== type) {
      errors.push(`${field} must be a ${type} (got ${typeof value})`);
    }
    return errors;
  }, []);
