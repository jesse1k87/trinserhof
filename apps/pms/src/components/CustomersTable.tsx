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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@trinserhof/ui';
import {
  formatCurrency,
  formatDate,
  getNewCustomer,
  resolveCustomerForEmail,
} from '@trinserhof/helpers';
import { canCreateReservation, type User } from '@trinserhof/types';
import { ArrowDownIcon, ArrowUpIcon, CaretSortIcon, PlusIcon } from '@radix-ui/react-icons';
import { CustomerContext } from 'src/context/CustomerContext';
import useCollection from 'src/hooks/useCollection';
import useCustomers from 'src/hooks/useCustomers';
import { Customer, getCustomers } from 'src/helpers/getCustomers';

const columns: ColumnDef<Customer>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="-mx-3 hover:cursor-pointer"
      >
        Guest
        {column.getIsSorted() === 'asc' ? (
          <ArrowUpIcon />
        ) : column.getIsSorted() === 'desc' ? (
          <ArrowDownIcon />
        ) : (
          <CaretSortIcon />
        )}
      </Button>
    ),
    cell: ({ row }) => row.original.name || row.original.email,
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
  {
    accessorKey: 'bookingsCount',
    header: 'Bookings',
  },
  {
    accessorKey: 'totalSpent',
    header: 'Total Spent',
    cell: ({ row }) => formatCurrency(row.original.totalSpent),
  },
  {
    accessorKey: 'lastStay',
    header: 'Last Stay',
    cell: ({ row }) => formatDate(new Date(row.original.lastStay)),
  },
  {
    id: 'channels',
    header: 'Channels',
    cell: ({ row }) => row.original.channels.join(', '),
  },
];

export const CustomersTable = ({ user }: { user: User }) => {
  const bookings = useCollection('bookings');
  const realCustomers = useCustomers();
  const customers = React.useMemo(() => {
    const realCustomersByEmail = new Map(
      realCustomers.map((customer) => [customer.email.trim().toLowerCase(), customer]),
    );

    return getCustomers(bookings).map((customer) => {
      const realCustomer = realCustomersByEmail.get(customer.email.trim().toLowerCase());
      if (!realCustomer) return customer;

      return {
        ...customer,
        name: [realCustomer.name, realCustomer.surname].filter(Boolean).join(' ') || customer.name,
      };
    });
  }, [bookings, realCustomers]);
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
      <div className="flex items-center gap-2 justify-between">
        <h1 className="text-lg font-semibold">Customers</h1>
        {canCreateReservation(user.role) && (
          <Button
            size="icon"
            onClick={() => setCustomer(getNewCustomer())}
            className="rounded-full hover:cursor-pointer"
            aria-label="Add customer"
          >
            <PlusIcon />
          </Button>
        )}
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
                <TableRow
                  key={row.id}
                  onClick={() =>
                    setCustomer(
                      resolveCustomerForEmail(row.original.email, realCustomers, {
                        name: row.original.name,
                        phone: row.original.phone,
                      }),
                    )
                  }
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
