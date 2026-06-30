import * as React from 'react';
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  ICONS,
  Input,
  Label,
  PageHeader,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@trinserhof/ui';
import {
  canEnterApp,
  canPerform,
  RoleDefinition,
  User,
  type Role,
  DEFAULT_ROLE,
} from '@trinserhof/types';
import { addUser, setUserRole } from '@trinserhof/firebase';
import { toast } from 'sonner';
import { type Page } from 'src/types/page';
import useUsers from 'src/hooks/useUsers';
import useRoles from 'src/hooks/useRoles';

const roleName = (roles: RoleDefinition[], role: Role): string =>
  roles.find((r) => r.id === role)?.name ?? role;

// Roles that grant no app access (e.g. BLOCKED) are flagged in red; everything
// else is neutral. Avoids hardcoding role ids now that roles live in the database.
const roleBadgeVariant = (role: Role): 'default' | 'secondary' | 'outline' | 'destructive' =>
  canEnterApp(role) ? 'secondary' : 'destructive';

const getColumns = ({
  user,
  roles,
  savingId,
  onRoleChange,
}: {
  user: User;
  roles: RoleDefinition[];
  savingId: string | null;
  onRoleChange: (userId: string, role: Role) => void;
}): ColumnDef<User>[] => [
  {
    accessorKey: 'email',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="-mx-3 hover:cursor-pointer"
      >
        Email
        {column.getIsSorted() === 'asc' ? (
          <ICONS.arrowUp />
        ) : column.getIsSorted() === 'desc' ? (
          <ICONS.arrowDown />
        ) : (
          <ICONS.sort />
        )}
      </Button>
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        {row.original.image ? (
          <img
            src={row.original.image}
            alt={row.original.email}
            className="h-8 w-8 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="h-8 w-8 shrink-0 rounded-full bg-base-200 flex items-center justify-center text-xs">
            {row.original.email[0]?.toUpperCase()}
          </div>
        )}
        <span>{row.original.email}</span>
      </div>
    ),
  },
  {
    accessorKey: 'role',
    header: 'Role',
    cell: ({ row }) => {
      const role = row.original.role ?? DEFAULT_ROLE;

      // Don't let a user change their own role — that's the easiest way to
      // accidentally lock yourself out of the app.
      const isSelf = user.id === row.original.id;

      if (canPerform(user.role, 'USER', 'UPDATE') && !isSelf) {
        return (
          <div onClick={(event) => event.stopPropagation()} className="w-fit">
            <Select
              value={role}
              disabled={savingId === row.original.id}
              onValueChange={(newRole) => onRoleChange(row.original.id, newRole as Role)}
            >
              <SelectTrigger className="h-8 w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roles.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      } else {
        return <Badge variant={roleBadgeVariant(role)}>{roleName(roles, role)}</Badge>;
      }
    },
  },
];

export const UsersTable = ({
  user,
  navigate,
}: {
  user: User;
  navigate: (page: Page, id?: string) => void;
}) => {
  const users = useUsers();
  const roles = useRoles();
  const [savingId, setSavingId] = React.useState<string | null>(null);
  const [addUserOpen, setAddUserOpen] = React.useState(false);
  const [newUserEmail, setNewUserEmail] = React.useState('');
  const [newUserRole, setNewUserRole] = React.useState<Role>(DEFAULT_ROLE);
  const [addingUser, setAddingUser] = React.useState(false);

  const canCreateUsers = canPerform(user.role, 'USER', 'CREATE');

  const handleRoleChange = async (userId: string, role: Role) => {
    setSavingId(userId);
    try {
      await setUserRole(userId, role);
      toast.success('Role updated.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update role.');
    } finally {
      setSavingId(null);
    }
  };

  const resetAddUserForm = () => {
    setNewUserEmail('');
    setNewUserRole(DEFAULT_ROLE);
  };

  const handleAddUser = async () => {
    setAddingUser(true);
    try {
      await addUser(newUserEmail, newUserRole);
      toast.success('User added.');
      setAddUserOpen(false);
      resetAddUserForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add user.');
    } finally {
      setAddingUser(false);
    }
  };

  const columns = React.useMemo(
    () => getColumns({ user, roles, savingId, onRoleChange: handleRoleChange }),
    [user, roles, savingId],
  );

  const table = useReactTable({
    data: users,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      sorting: [{ id: 'email', desc: false }],
      pagination: { pageSize: 20 },
    },
  });

  return (
    <div className="flex flex-col gap-4 w-full max-w-5xl px-4 py-6">
      <PageHeader icon={<ICONS.users className="size-5" />} title="Users">
        {canCreateUsers && (
          <Button
            size="icon"
            onClick={() => setAddUserOpen(true)}
            className="ml-auto rounded-full hover:cursor-pointer"
            aria-label="Add user"
          >
            <ICONS.add />
          </Button>
        )}
      </PageHeader>

      <div className="rounded-md">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  onClick={() => navigate('user-detail', row.original.id)}
                  className="cursor-pointer"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No users yet. Add user records to the database to grant access.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {table.getPageCount() > 1 && (
        <div className="flex items-center justify-end gap-2">
          <span className="text-sm text-base-content/60">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="hover:cursor-pointer"
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="hover:cursor-pointer"
          >
            Next
          </Button>
        </div>
      )}

      <Dialog
        open={addUserOpen}
        onOpenChange={(open) => {
          if (addingUser) return;
          setAddUserOpen(open);
          if (!open) resetAddUserForm();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add user</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-user-email">Email</Label>
              <Input
                id="new-user-email"
                type="email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                placeholder="name@example.com"
                disabled={addingUser}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-user-role">Role</Label>
              <Select
                value={newUserRole}
                onValueChange={(role) => setNewUserRole(role as Role)}
                disabled={addingUser}
              >
                <SelectTrigger id="new-user-role" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddUserOpen(false)}
              disabled={addingUser}
              className="hover:cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddUser}
              disabled={addingUser || !newUserEmail.trim()}
              className="hover:cursor-pointer"
            >
              {addingUser ? 'Adding…' : 'Add user'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
