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
import { formatDate, getNewBooking } from '@trinserhof/helpers';
import { Booking, canPerform, Room, STATUSES, type User } from '@trinserhof/types';
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CaretSortIcon,
  ListBulletIcon,
  PlusIcon,
} from '@radix-ui/react-icons';
import { BookingContext } from 'src/context/BookingContext';
import useCollection from 'src/hooks/useCollection';
import useRooms from 'src/hooks/useRooms';

const getColumns = (rooms: Room[]): ColumnDef<Booking>[] => [
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
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.original.status;
      const label = STATUSES.find((s) => s.id === status)?.label ?? status;
      return (
        <div className="flex items-center">
          <span className={`booking-status-dot status-${status}`} />
          {label}
        </div>
      );
    },
  },
  {
    id: 'primaryGuest',
    header: 'Primary guest',
    cell: ({ row }) => row.original.name || row.original.email,
  },
  {
    accessorKey: 'roomId',
    header: 'Room',
    cell: ({ row }) =>
      rooms.find((r) => r.id === row.original.roomId)?.label ?? row.original.roomId,
  },
  {
    id: 'occupants',
    header: 'Occupants',
    cell: ({ row }) => {
      const { adults, children, babies, pets } = row.original;
      const parts = [`${adults} adult${adults === 1 ? '' : 's'}`];
      if (children) parts.push(`${children} child${children === 1 ? '' : 'ren'}`);
      if (babies) parts.push(`${babies} bab${babies === 1 ? 'y' : 'ies'}`);
      if (pets) parts.push(`${pets} pet${pets === 1 ? '' : 's'}`);
      return parts.join(', ');
    },
  },
];

export const BookingsTable = ({ user }: { user: User }) => {
  const bookings = useCollection('bookings');
  const rooms = useRooms();
  const [, setBooking] = React.useContext(BookingContext);

  const columns = React.useMemo(() => getColumns(rooms), [rooms]);

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
      <PageHeader icon={<ListBulletIcon className="size-5" />} title="Bookings">
        {canPerform(user.role, 'BOOKING', 'CREATE') && (
          <Button
            size="icon"
            onClick={() => setBooking(getNewBooking())}
            className="ml-auto rounded-full hover:cursor-pointer"
            aria-label="Add booking"
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
                  onClick={() => setBooking(row.original)}
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
                  No bookings.
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
