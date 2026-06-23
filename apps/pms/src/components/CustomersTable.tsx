import * as React from 'react';
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@trinserhof/ui';
import { formatCurrency, formatDate } from '@trinserhof/helpers';
import { Booking, CHANNELS } from '@trinserhof/types';
import { ArrowDownIcon, ArrowUpIcon, CaretSortIcon } from '@radix-ui/react-icons';
import useCollection from 'src/hooks/useCollection';

type Customer = {
  email: string;
  name?: string;
  phone?: string;
  bookingsCount: number;
  totalSpent: number;
  lastStay: string;
  channels: string[];
};

const getCustomers = (bookings: Booking[]): Customer[] => {
  const customersByEmail = new Map<string, Customer>();

  for (const booking of bookings) {
    const email = booking.email?.trim().toLowerCase();
    if (!email) continue;

    const channelLabel = CHANNELS.find((c) => c.id === booking.channel)?.label ?? booking.channel;
    const existing = customersByEmail.get(email);

    if (!existing) {
      customersByEmail.set(email, {
        email: booking.email,
        name: booking.name,
        phone: booking.phone,
        bookingsCount: 1,
        totalSpent: booking.price ?? 0,
        lastStay: booking.checkIn,
        channels: [channelLabel],
      });
      continue;
    }

    existing.name = booking.name || existing.name;
    existing.phone = booking.phone || existing.phone;
    existing.bookingsCount += 1;
    existing.totalSpent += booking.price ?? 0;
    if (booking.checkIn > existing.lastStay) existing.lastStay = booking.checkIn;
    if (!existing.channels.includes(channelLabel)) existing.channels.push(channelLabel);
  }

  return Array.from(customersByEmail.values());
};

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

export const CustomersTable = () => {
  const bookings = useCollection('bookings');
  const customers = React.useMemo(() => getCustomers(bookings), [bookings]);

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
      <div className="flex items-center gap-2">
        <h1 className="text-lg font-semibold">All Customers</h1>
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
                  No customers.
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
