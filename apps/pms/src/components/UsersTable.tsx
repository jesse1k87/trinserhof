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
import { User, type Role, DEFAULT_ROLE } from '@trinserhof/types';
import { setUserRole } from '@trinserhof/database';
import { OWNER_EMAIL } from '@trinserhof/constants';
import { ArrowLeftIcon, ArrowDownIcon, ArrowUpIcon, CaretSortIcon } from '@radix-ui/react-icons';
import { toast } from 'sonner';
import useUsers from 'src/hooks/useUsers';

const isOwnerEmail = (email: string) =>
  email.toLowerCase().trim() === OWNER_EMAIL.toLowerCase().trim();

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

// Roles the owner can assign to another user. OWNER is intentionally excluded —
// being the owner comes from matching OWNER_EMAIL, not from a stored role.
const ASSIGNABLE_ROLES: Role[] = ['BLOCKED', 'VIEWER', 'MANAGER'];

const getColumns = ({
  isOwner,
  savingId,
  onRoleChange,
}: {
  isOwner: boolean;
  savingId: string | null;
  onRoleChange: (userId: string, role: Role) => void;
}): ColumnDef<User>[] => [
  {
    id: 'profileImage',
    header: '',
    enableSorting: false,
    cell: ({ row }) =>
      row.original.profileImageUrl ? (
        <img
          src={row.original.profileImageUrl}
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
      const ownerRow = isOwnerEmail(row.original.email);
      const canEditRole = isOwner && !ownerRow;
      const role = row.original.role ?? DEFAULT_ROLE;

      if (ownerRow) return <Badge>{roleLabel.OWNER}</Badge>;

      if (canEditRole) {
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
      }

      return <Badge variant={roleBadgeVariant[role]}>{roleLabel[role]}</Badge>;
    },
  },
];

export const UsersTable = ({ onBack, isOwner }: { onBack: () => void; isOwner: boolean }) => {
  const users = useUsers();
  const [savingId, setSavingId] = React.useState<string | null>(null);

  const handleRoleChange = async (userId: string, role: Role) => {
    setSavingId(userId);
    try {
      await setUserRole(userId, role);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update role.');
    } finally {
      setSavingId(null);
    }
  };

  const columns = React.useMemo(
    () => getColumns({ isOwner, savingId, onRoleChange: handleRoleChange }),
    [isOwner, savingId],
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
      <div className="flex items-center gap-2">
        <Button
          size="icon"
          variant="outline"
          onClick={onBack}
          className="rounded-full hover:cursor-pointer"
        >
          <ArrowLeftIcon />
        </Button>
        <h1 className="text-lg font-semibold">All Users</h1>
      </div>

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
    </div>
  );
};
