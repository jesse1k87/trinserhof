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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@trinserhof/ui';
import { formatCurrency, formatDate } from '@trinserhof/helpers';
import { Booking, CHANNELS, ROOMS } from '@trinserhof/types';
import { ArrowLeftIcon, ArrowDownIcon, ArrowUpIcon, CaretSortIcon } from '@radix-ui/react-icons';
import useCollection from 'src/hooks/useCollection';

const columns: ColumnDef<Booking>[] = [
  {
    accessorKey: 'checkIn',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="-mx-3 hover:cursor-pointer"
      >
        Check-in
        {column.getIsSorted() === 'asc' ? (
          <ArrowUpIcon />
        ) : column.getIsSorted() === 'desc' ? (
          <ArrowDownIcon />
        ) : (
          <CaretSortIcon />
        )}
      </Button>
    ),
    cell: ({ row }) => formatDate(new Date(row.original.checkIn)),
  },
  {
    accessorKey: 'checkOut',
    header: 'Check-out',
    cell: ({ row }) => formatDate(new Date(row.original.checkOut)),
  },
  {
    id: 'guest',
    header: 'Guest',
    cell: ({ row }) => row.original.name || row.original.email,
  },
  {
    accessorKey: 'roomId',
    header: 'Room',
    cell: ({ row }) =>
      ROOMS.find((r) => r.id === row.original.roomId)?.label ?? row.original.roomId,
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => <Badge variant="outline">{row.original.status}</Badge>,
  },
  {
    accessorKey: 'channel',
    header: 'Channel',
    cell: ({ row }) =>
      CHANNELS.find((c) => c.id === row.original.channel)?.label ?? row.original.channel,
  },
  {
    id: 'guests',
    header: 'Guests',
    cell: ({ row }) => {
      const { adults, children, babies, pets } = row.original;
      const parts = [`${adults} adult${adults === 1 ? '' : 's'}`];
      if (children) parts.push(`${children} child${children === 1 ? '' : 'ren'}`);
      if (babies) parts.push(`${babies} bab${babies === 1 ? 'y' : 'ies'}`);
      if (pets) parts.push(`${pets} pet${pets === 1 ? '' : 's'}`);
      return parts.join(', ');
    },
  },
  {
    accessorKey: 'price',
    header: 'Price',
    cell: ({ row }) => formatCurrency(row.original.price),
  },
];

export const BookingsTable = ({ onBack }: { onBack: () => void }) => {
  const bookings = useCollection('bookings');

  const table = useReactTable({
    data: bookings,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      sorting: [{ id: 'checkIn', desc: false }],
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
        <h1 className="text-lg font-semibold">All Bookings</h1>
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
                  No bookings.
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
