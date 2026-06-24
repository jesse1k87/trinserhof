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
import { setUserRole } from '@trinserhof/database';
import { ArrowDownIcon, ArrowUpIcon, AvatarIcon, CaretSortIcon } from '@radix-ui/react-icons';
import { toast } from 'sonner';
import useUsers from 'src/hooks/useUsers';

const roleLabel: Record<Role, string> = {
  OWNER: 'Owner',
  MANAGER: 'Manager',
  VIEWER: 'Viewer',
  BLOCKED: 'Blocked',
};

const roleBadgeVariant: Record<Role, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  OWNER: 'default',
  MANAGER: 'secondary',
  VIEWER: 'outline',
  BLOCKED: 'destructive',
};

const ASSIGNABLE_ROLES: Role[] = ['BLOCKED', 'VIEWER', 'MANAGER'];

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
    id: 'profileImage',
    header: '',
    enableSorting: false,
    cell: ({ row }) =>
      row.original.image ? (
        <img
          src={row.original.image}
          alt={row.original.email}
          className="h-8 w-8 shrink-0 rounded-full object-cover"
        />
      ) : (
        <div className="h-8 w-8 shrink-0 rounded-full bg-muted flex items-center justify-center text-xs">
          {row.original.email[0]?.toUpperCase()}
        </div>
      ),
  },
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
      <PageHeader icon={<AvatarIcon className="size-5" />} title="Users" />

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
    </div>
  );
};
