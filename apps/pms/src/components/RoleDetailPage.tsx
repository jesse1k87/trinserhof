import * as React from 'react';
import {
  canPerform,
  CAPABILITIES,
  CRUD_ACTIONS,
  ENTITIES,
  type CrudAction,
  type PermissionKey,
  RoleDefinition,
  User,
} from '@trinserhof/types';
import { getNewRoleDefinition, roleDefinitionsAreDifferent } from '@trinserhof/helpers';
import { type Page } from 'src/types/page';
import {
  ArrowLeftIcon,
  Button,
  Checkbox,
  Input,
  NoAccess,
  PageHeader,
  RoleIcon,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@trinserhof/ui';
import useRoles from 'src/hooks/useRoles';
import { logAuditEvent, saveRole } from '@trinserhof/supabase';
import { toast } from 'sonner';

// "ACCOUNTING_CATEGORY" -> "Accounting category", "ENTER_APP" -> "Enter app".
const formatLabel = (value: string) =>
  value
    .toLowerCase()
    .split('_')
    .map((word, index) => (index === 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word))
    .join(' ');

const getSaveErrorMessage = (error: unknown) => {
  if (error instanceof Error && error.message.startsWith('Invalid role data:')) {
    return `This role could not be saved: ${error.message.replace('Invalid role data: ', '')}`;
  }
  return 'Something went wrong while saving the role.';
};

export const RoleDetailPage = ({
  id,
  user,
  navigate,
}: {
  id: string;
  user: User;
  navigate: (page: Page, id?: string) => void;
}) => {
  const isNew = id === 'new';

  const roles = useRoles();

  const originalRole = isNew ? undefined : roles.find((r) => r.id === id);

  const [role, setRole] = React.useState<RoleDefinition | undefined>(() =>
    isNew ? getNewRoleDefinition() : undefined,
  );

  React.useEffect(() => {
    if (!isNew) setRole(originalRole);
  }, [isNew, originalRole]);

  React.useEffect(() => {
    if (!isNew && roles.length > 0 && !originalRole) {
      navigate('roles-table');
    }
  }, [isNew, roles.length, originalRole, navigate]);

  const canCreate = canPerform(user.role, 'ROLE', 'CREATE');
  const canUpdate = canPerform(user.role, 'ROLE', 'UPDATE');

  if (!canPerform(user.role, 'ROLE', 'READ')) return <NoAccess />;
  if (isNew && !canCreate) return null;
  if (!role) return null;

  const enabled = isNew ? canCreate : canUpdate;
  const hasChanges = isNew || (!!originalRole && roleDefinitionsAreDifferent(originalRole, role));

  const hasPermission = (permission: PermissionKey) => role.permissions.includes(permission);

  const togglePermission = (permission: PermissionKey, checked: boolean) => {
    const permissions = checked
      ? [...role.permissions, permission]
      : role.permissions.filter((existing) => existing !== permission);
    setRole({ ...role, permissions });
  };

  const handleSave = async () => {
    const trimmedId = role.id.trim();
    if (!originalRole && roles.some((r) => r.id === trimmedId)) {
      toast.error(`Role ${trimmedId} already exists.`);
      return;
    }
    try {
      const saved = await saveRole({ ...role, id: trimmedId });
      logAuditEvent(originalRole ? 'ROLE_UPDATED' : 'ROLE_CREATED', user.email);
      if (isNew) navigate('roles-table');
      else setRole(saved);
    } catch (error) {
      toast.error(getSaveErrorMessage(error));
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-2xl px-4 py-6">
      <div className="flex flex-row items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Back to roles"
          className="hover:cursor-pointer"
          onClick={() => navigate('roles-table')}
        >
          <ArrowLeftIcon />
        </Button>
        <PageHeader icon={<RoleIcon className="size-5" />} title={isNew ? 'New role' : 'Role'}>
          {enabled && hasChanges && <Button onClick={handleSave}>Save</Button>}
        </PageHeader>
      </div>

      <div className="flex flex-col w-full grid gap-1">
        <div className="pt-1 text-xs text-muted-foreground">Code</div>
        <Input
          placeholder="e.g. MANAGER"
          value={role.id}
          disabled={!enabled || Boolean(originalRole)}
          onChange={(event) => setRole({ ...role, id: event.target.value })}
        />
      </div>

      <div className="flex flex-col w-full grid gap-1">
        <div className="pt-1 text-xs text-muted-foreground">Name</div>
        <Input
          placeholder="Enter a name"
          value={role.name}
          disabled={!enabled}
          onChange={(event) => setRole({ ...role, name: event.target.value })}
        />
      </div>

      <div className="flex flex-col w-full gap-2">
        <div className="pt-1 text-xs text-muted-foreground">General</div>
        <div className="rounded-md border divide-y">
          {CAPABILITIES.map((capability) => (
            <label
              key={capability}
              className="flex flex-row items-center gap-3 px-3 py-2 hover:cursor-pointer"
            >
              <Checkbox
                checked={hasPermission(capability)}
                disabled={!enabled}
                onCheckedChange={(checked) => togglePermission(capability, checked)}
              />
              <span className="text-sm">{formatLabel(capability)}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-col w-full gap-2">
        <div className="pt-1 text-xs text-muted-foreground">Permissions</div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Resource</TableHead>
                {CRUD_ACTIONS.map((action) => (
                  <TableHead key={action} className="text-center">
                    {formatLabel(action)}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {ENTITIES.map((entity) => (
                <TableRow key={entity}>
                  <TableCell className="font-medium">{formatLabel(entity)}</TableCell>
                  {CRUD_ACTIONS.map((action: CrudAction) => {
                    const permission = `${entity}:${action}` as PermissionKey;
                    return (
                      <TableCell key={action} className="text-center">
                        <Checkbox
                          aria-label={`${formatLabel(entity)} ${formatLabel(action)}`}
                          checked={hasPermission(permission)}
                          disabled={!enabled}
                          onCheckedChange={(checked) => togglePermission(permission, checked)}
                        />
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};
