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
  StatusIndicator,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@trinserhof/ui';
import { formatDate, getStatusIndicator } from '@trinserhof/helpers';
import {
  Booking,
  BOOKING_STATUSES,
  BookingStatus,
  canPerform,
  DEFAULT_BOOKING_STATUS,
  type User,
} from '@trinserhof/types';
import {
  ArrowDown as ArrowDownIcon,
  ArrowUp as ArrowUpIcon,
  ChevronsUpDown as CaretSortIcon,
  BedDouble as BedIcon,
  Plus as PlusIcon,
} from 'lucide-react';
import { FilterBar } from 'src/components/FilterBar';
import useCollection from 'src/hooks/useCollection';
import useRooms from 'src/hooks/useRooms';
import { useToggleFilter } from 'src/hooks/useToggleFilter';
import { type Page } from 'src/types/page';

const STATUS_OPTIONS = BOOKING_STATUSES.map(({ id, label }) => ({ value: id, label }));

// Normalise legacy/missing statuses into the PENDING bucket so every booking
// maps onto an actual filter chip (otherwise an unknown status would silently
// drop the row from the table). Module-scoped so its reference stays stable for
// the memoised filter in useToggleFilter.
const getBookingFilterStatus = (booking: Booking): BookingStatus =>
  BOOKING_STATUSES.some((status) => status.id === booking.status)
    ? booking.status
    : DEFAULT_BOOKING_STATUS;

const getColumns = (): ColumnDef<Booking>[] => [
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = getBookingFilterStatus(row.original);
      const { color, dotClassName, label } = getStatusIndicator(status);
      return <StatusIndicator color={color} dotClassName={dotClassName} label={label} />;
    },
  },
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
    accessorKey: 'roomId',
    header: 'Room',
    cell: ({ row }) => row.original.roomId,
  },
  {
    id: 'occupants',
    header: 'Occupants',
    cell: ({ row }) => {
      const { adults, children, pets } = row.original;
      const parts = [`${adults} adult${adults === 1 ? '' : 's'}`];
      if (children) parts.push(`${children} child${children === 1 ? '' : 'ren'}`);
      if (pets) parts.push(`${pets} pet${pets === 1 ? '' : 's'}`);
      return parts.join(', ');
    },
  },
];

export const BookingsTable = ({
  user,
  navigate,
}: {
  user: User;
  navigate: (page: Page, id?: string) => void;
}) => {
  const bookings = useCollection('bookings');
  const rooms = useRooms();
  const { selected, toggle, filtered } = useToggleFilter(
    bookings,
    STATUS_OPTIONS,
    getBookingFilterStatus,
  );

  const columns = React.useMemo(() => getColumns(), [rooms]);

  const table = useReactTable({
    data: filtered,
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
      <PageHeader icon={<BedIcon className="size-5" />} title="Room bookings">
        {canPerform(user.role, 'BOOKING', 'CREATE') && (
          <Button
            size="icon"
            onClick={() => navigate('booking-create')}
            className="ml-auto rounded-full hover:cursor-pointer"
            aria-label="Add booking"
          >
            <PlusIcon />
          </Button>
        )}
      </PageHeader>

      <div className="hidden">
        <FilterBar options={STATUS_OPTIONS} selected={selected} onToggle={toggle} />
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
                  onClick={() => navigate('booking-detail', row.original.id)}
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
