import { ALL_PERMISSIONS, type RoleDefinition } from '@trinserhof/types';

export const REQUIRED_ROLE_FIELD_TYPES: Record<string, 'string'> = {
  id: 'string',
  name: 'string',
};

export const getRoleValidationErrors = (role: RoleDefinition): string[] => {
  const errors = Object.entries(REQUIRED_ROLE_FIELD_TYPES).reduce<string[]>(
    (errors, [field, type]) => {
      const value = (role as Record<string, unknown>)[field];
      if (value === undefined || value === null || value === '') {
        errors.push(`${field} is missing`);
      } else if (typeof value !== type) {
        errors.push(`${field} must be a ${type} (got ${typeof value})`);
      }
      return errors;
    },
    [],
  );

  if (!Array.isArray(role.permissions)) {
    errors.push('permissions must be an array');
  } else {
    const unknownPermissions = role.permissions.filter(
      (permission) => !ALL_PERMISSIONS.includes(permission),
    );
    if (unknownPermissions.length > 0) {
      errors.push(`unknown permissions: ${unknownPermissions.join(', ')}`);
    }
  }

  return errors;
};
