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
  Button,
  PageHeader,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@trinserhof/ui';
import { canPerform, type Customer, type User } from '@trinserhof/types';

import {
  ArrowDown as ArrowDownIcon,
  ArrowUp as ArrowUpIcon,
  ChevronsUpDown as CaretSortIcon,
  User as PersonIcon,
  Plus as PlusIcon,
} from 'lucide-react';
import { CustomerContext } from 'src/context/CustomerContext';
import useCustomers from 'src/hooks/useCustomers';
import { getNewCustomer } from '@trinserhof/helpers';

const columns: ColumnDef<Customer>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="-mx-3 hover:cursor-pointer"
      >
        Name
        {column.getIsSorted() === 'asc' ? (
          <ArrowUpIcon />
        ) : column.getIsSorted() === 'desc' ? (
          <ArrowDownIcon />
        ) : (
          <CaretSortIcon />
        )}
      </Button>
    ),
    cell: ({ row }) =>
      [row.original.name, row.original.surname].filter(Boolean).join(' ') || row.original.email,
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
  {
    accessorKey: 'phone',
    header: 'Phone',
    cell: ({ row }) => row.original.phone || '—',
  },
];

export const CustomersTable = ({ user }: { user: User }) => {
  const customers = useCustomers();
  const [, setCustomer] = React.useContext(CustomerContext);

  const table = useReactTable({
    data: customers,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      sorting: [{ id: 'name', desc: false }],
      pagination: { pageSize: 20 },
    },
  });

  return (
    <div className="flex flex-col gap-4 w-full max-w-5xl px-4 py-6">
      <PageHeader icon={<PersonIcon className="size-5" />} title="Customers">
        {canPerform(user.role, 'CUSTOMER', 'CREATE') && (
          <Button
            size="icon"
            onClick={() => setCustomer(getNewCustomer())}
            className="ml-auto rounded-full hover:cursor-pointer"
            aria-label="Add customer"
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
                <TableRow
                  key={row.id}
                  onClick={() => setCustomer(row.original)}
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
                  No customers.
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
