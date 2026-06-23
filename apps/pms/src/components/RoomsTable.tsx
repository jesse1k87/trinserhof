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
import { formatCurrency } from '@trinserhof/helpers';
import { Booking, Room, ROOMS, defaultRoomId } from '@trinserhof/types';
import { ArrowDownIcon, ArrowUpIcon, CaretSortIcon } from '@radix-ui/react-icons';
import useCollection from 'src/hooks/useCollection';

type RoomRow = Room & {
  bookingsCount: number;
  totalRevenue: number;
};

const formatPricePerNight = (pricePerNight: Room['pricePerNight']): string => {
  if (typeof pricePerNight === 'number') {
    return pricePerNight ? formatCurrency(pricePerNight) : '—';
  }

  const tiers = Object.entries(pricePerNight).sort(([a], [b]) => Number(a) - Number(b));
  return tiers
    .map(([nights, price]) =>
      Number(nights) === 0 ? formatCurrency(price) : `${formatCurrency(price)} (${nights}+ nights)`,
    )
    .join(' / ');
};

const getRooms = (bookings: Booking[]): RoomRow[] => {
  const statsByRoom = new Map<string, { bookingsCount: number; totalRevenue: number }>();

  for (const booking of bookings) {
    const roomId = booking.roomId;
    if (!roomId) continue;

    const existing = statsByRoom.get(roomId);
    if (existing) {
      existing.bookingsCount += 1;
      existing.totalRevenue += booking.price ?? 0;
    } else {
      statsByRoom.set(roomId, { bookingsCount: 1, totalRevenue: booking.price ?? 0 });
    }
  }

  return ROOMS.filter((room) => room.id !== defaultRoomId).map((room) => {
    const stats = statsByRoom.get(room.id);
    return {
      ...room,
      bookingsCount: stats?.bookingsCount ?? 0,
      totalRevenue: stats?.totalRevenue ?? 0,
    };
  });
};

const columns: ColumnDef<RoomRow>[] = [
  {
    accessorKey: 'id',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="-mx-3 hover:cursor-pointer"
      >
        Room
        {column.getIsSorted() === 'asc' ? (
          <ArrowUpIcon />
        ) : column.getIsSorted() === 'desc' ? (
          <ArrowDownIcon />
        ) : (
          <CaretSortIcon />
        )}
      </Button>
    ),
    sortingFn: (a, b) => Number(a.original.id) - Number(b.original.id),
  },
  {
    accessorKey: 'label',
    header: 'Type',
  },
  {
    accessorKey: 'description',
    header: 'Description',
    cell: ({ row }) => <span className="text-muted-foreground">{row.original.description}</span>,
  },
  {
    accessorKey: 'pricePerNight',
    header: 'Price / Night',
    cell: ({ row }) => formatPricePerNight(row.original.pricePerNight),
  },
  {
    accessorKey: 'bookingsCount',
    header: 'Bookings',
    cell: ({ row }) => <Badge variant="outline">{row.original.bookingsCount}</Badge>,
  },
  {
    accessorKey: 'totalRevenue',
    header: 'Revenue',
    cell: ({ row }) => formatCurrency(row.original.totalRevenue),
  },
];

export const RoomsTable = () => {
  const bookings = useCollection('bookings');
  const rooms = React.useMemo(() => getRooms(bookings), [bookings]);

  const table = useReactTable({
    data: rooms,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      sorting: [{ id: 'id', desc: false }],
      pagination: { pageSize: 20 },
    },
  });

  return (
    <div className="flex flex-col gap-4 w-full max-w-5xl px-4 py-6">
      <div className="flex items-center gap-2">
        <h1 className="text-lg font-semibold">All Rooms</h1>
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
                  No rooms.
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
