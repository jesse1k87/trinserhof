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
import { canPerform, User, type Role, DEFAULT_ROLE } from '@trinserhof/types';
import { addUser, setUserRole } from '@trinserhof/firebase';
import { ArrowDownIcon, ArrowUpIcon, AvatarIcon, CaretSortIcon, PlusIcon } from '@trinserhof/ui';
import { toast } from 'sonner';
import useUsers from 'src/hooks/useUsers';

const roleLabel: Record<Role, string> = {
  OWNER: 'Owner',
  MANAGER: 'Manager',
  READER: 'Reader',
  BLOCKED: 'Blocked',
};

const roleBadgeVariant: Record<Role, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  OWNER: 'default',
  MANAGER: 'secondary',
  READER: 'outline',
  BLOCKED: 'destructive',
};

const ASSIGNABLE_ROLES: Role[] = ['BLOCKED', 'READER', 'MANAGER'];

const getColumns = ({
  user,
  savingId,
  onRoleChange,
}: {
  user: User;
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
          <ArrowUpIcon />
        ) : column.getIsSorted() === 'desc' ? (
          <ArrowDownIcon />
        ) : (
          <CaretSortIcon />
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
          <div className="h-8 w-8 shrink-0 rounded-full bg-muted flex items-center justify-center text-xs">
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

      const currentUserIsOwner = user.id === row.original.id && user.role === 'OWNER';

      if (canPerform(user.role, 'USER', 'UPDATE') && !currentUserIsOwner) {
        return (
          <Select
            value={role}
            disabled={savingId === row.original.id}
            onValueChange={(newRole) => onRoleChange(row.original.id, newRole as Role)}
          >
            <SelectTrigger className="h-8 w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ASSIGNABLE_ROLES.map((r) => (
                <SelectItem key={r} value={r}>
                  {roleLabel[r]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      } else {
        return <Badge variant={roleBadgeVariant[role]}>{roleLabel[role]}</Badge>;
      }
    },
  },
];

export const UsersTable = ({ user }: { user: User }) => {
  const users = useUsers();
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
    () => getColumns({ user, savingId, onRoleChange: handleRoleChange }),
    [user, savingId],
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
      <PageHeader icon={<AvatarIcon className="size-5" />} title="Users">
        {canCreateUsers && (
          <Button
            size="icon"
            onClick={() => setAddUserOpen(true)}
            className="ml-auto rounded-full hover:cursor-pointer"
            aria-label="Add user"
          >
            <PlusIcon />
          </Button>
        )}
      </PageHeader>

      <div className="rounded-md border">
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
                <TableRow key={row.id}>
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
          <span className="text-sm text-muted-foreground">
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
                  {ASSIGNABLE_ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {roleLabel[role]}
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
