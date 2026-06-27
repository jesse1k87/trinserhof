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
import { formatDate } from '@trinserhof/helpers';
import {
  Booking,
  BOOKING_STATUSES,
  BookingStatus,
  canPerform,
  Customer,
  DEFAULT_BOOKING_STATUS,
  type User,
} from '@trinserhof/types';
import { ArrowDownIcon, ArrowUpIcon, BOOKING_ICONS, CaretSortIcon, PlusIcon } from '@trinserhof/ui';
import { FilterBar } from 'src/components/FilterBar';
import useCollection from 'src/hooks/useCollection';
import useCustomers from 'src/hooks/useCustomers';
import useRooms from 'src/hooks/useRooms';
import { useToggleFilter } from 'src/hooks/useToggleFilter';
import { type Page } from 'src/types/page';
import { BookingStatusIndicator } from './BookingStatusIndicator';

const STATUS_OPTIONS = BOOKING_STATUSES.map(({ id, label }) => ({ value: id, label }));

// Normalise legacy/missing statuses into the PENDING bucket so every booking
// maps onto an actual filter chip (otherwise an unknown status would silently
// drop the row from the table). Module-scoped so its reference stays stable for
// the memoised filter in useToggleFilter.
const getBookingFilterStatus = (booking: Booking): BookingStatus =>
  BOOKING_STATUSES.some((status) => status.id === booking.status)
    ? booking.status
    : DEFAULT_BOOKING_STATUS;

const formatCustomerName = (customer: Customer): string =>
  [customer.name, customer.surname].filter(Boolean).join(' ') || customer.email || 'Unnamed guest';

const getCustomerNames = (booking: Booking, customersById: Map<string, Customer>): string => {
  const names = (booking.customers ?? [])
    .map((id) => customersById.get(id))
    .filter((c): c is Customer => Boolean(c))
    .map(formatCustomerName);
  return names.length ? names.join(', ') : 'Unknown guest';
};

const getColumns = (customersById: Map<string, Customer>): ColumnDef<Booking>[] => [
  {
    id: 'customers',
    header: 'Customers',
    cell: ({ row }) => getCustomerNames(row.original, customersById),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => <BookingStatusIndicator status={getBookingFilterStatus(row.original)} />,
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
      return (
        <div className="flex flex-wrap items-center gap-1">
          {Array.from({ length: adults }).map((_, i) => (
            <BOOKING_ICONS.adult key={`adult-${i}`} className="size-4" aria-label="Adult" />
          ))}
          {Array.from({ length: children }).map((_, i) => (
            <BOOKING_ICONS.child key={`child-${i}`} className="size-4" aria-label="Child" />
          ))}
          {Array.from({ length: pets }).map((_, i) => (
            <BOOKING_ICONS.pet key={`pet-${i}`} className="size-4" aria-label="Pet" />
          ))}
        </div>
      );
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
  const customers = useCustomers();
  const customersById = React.useMemo(
    () => new Map(customers.map((customer) => [customer.id, customer])),
    [customers],
  );
  const { selected, toggle, filtered } = useToggleFilter(
    bookings,
    STATUS_OPTIONS,
    getBookingFilterStatus,
  );

  const columns = React.useMemo(() => getColumns(customersById), [rooms, customersById]);

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
      <PageHeader icon={<BOOKING_ICONS.bed className="size-5" />} title="Room bookings">
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
