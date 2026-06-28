import { type RoleDefinition } from '@trinserhof/types';

const samePermissions = (a: RoleDefinition['permissions'], b: RoleDefinition['permissions']) => {
  if (a.length !== b.length) return false;
  const sortedB = [...b].sort();
  return [...a].sort().every((permission, index) => permission === sortedB[index]);
};

export const roleDefinitionsAreDifferent = (a: RoleDefinition, b: RoleDefinition) =>
  a.name !== b.name || !samePermissions(a.permissions, b.permissions);
