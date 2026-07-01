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
  AddIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  Button,
  NoAccess,
  PageHeader,
  RoleIcon,
  SmallText,
  SortIcon,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@trinserhof/ui';
import { canPerform, RoleDefinition, type User } from '@trinserhof/types';
import { type Page } from 'src/types/page';
import useRoles from 'src/hooks/useRoles';

const columns: ColumnDef<RoleDefinition>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <Button
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="-mx-3 hover:cursor-pointer"
      >
        Role
        {column.getIsSorted() === 'asc' ? (
          <ArrowUpIcon />
        ) : column.getIsSorted() === 'desc' ? (
          <ArrowDownIcon />
        ) : (
          <SortIcon />
        )}
      </Button>
    ),
  },
  {
    accessorKey: 'id',
    header: 'Code',
    cell: ({ row }) => (
      <SmallText as="span" className="font-mono">
        {row.original.id}
      </SmallText>
    ),
  },
  {
    id: 'permissions',
    header: 'Permissions',
    cell: ({ row }) => (
      <span className="text-base-content/60">{row.original.permissions.length} enabled</span>
    ),
  },
];

export const RolesTable = ({
  user,
  navigate,
}: {
  user: User;
  navigate: (page: Page, id?: string) => void;
}) => {
  const roles = useRoles();

  const table = useReactTable({
    data: roles,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      sorting: [{ id: 'name', desc: false }],
      pagination: { pageSize: 20 },
    },
  });

  if (!canPerform(user.role, 'ROLE', 'READ')) return <NoAccess />;

  return (
    <div className="flex flex-col gap-4 w-full max-w-5xl px-4 py-6">
      <PageHeader icon={<RoleIcon className="size-5" />} title="Roles">
        {canPerform(user.role, 'ROLE', 'CREATE') && (
          <Button
            onClick={() => navigate('role-detail', 'new')}
            className="ml-auto rounded-full hover:cursor-pointer"
            aria-label="Add role"
          >
            <AddIcon />
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
                  onClick={() => navigate('role-detail', row.original.id)}
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
                  No roles.
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
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="hover:cursor-pointer"
          >
            Previous
          </Button>
          <Button
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
