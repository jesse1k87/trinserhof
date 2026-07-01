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
  PageHeader,
  Section,
  SortIcon,
  StatusIndicator,
  Table,
  TableBody,
  TableBookingIcon,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@trinserhof/ui';
import {
  formatDateTime,
  getRestaurantReservationDateStatus,
  TABLE_RESERVATION_DATE_STATUSES,
  type RestaurantReservationDateStatus,
} from '@trinserhof/helpers';
import {
  canPerform,
  type Customer,
  DEFAULT_LOCALE,
  getRestaurantReservationEnd,
  type Locale,
  type RestaurantTable,
  type RestaurantReservation,
  type User,
} from '@trinserhof/types';
import { type Page } from 'src/types/page';
import { FilterBar } from 'src/components/FilterBar';
import useCustomers from 'src/hooks/useCustomers';
import useRestaurantTables from 'src/hooks/useRestaurantTables';
import { useToggleFilter } from 'src/hooks/useToggleFilter';
import useRestaurantReservations from '../hooks/useRestaurantReservations';

const dateStatusLabel: Record<RestaurantReservationDateStatus, string> = {
  PAST: 'Past',
  TODAY: 'Today',
  FUTURE: 'Future',
};

const dateStatusColor: Record<RestaurantReservationDateStatus, string> = {
  PAST: 'var(--color-neutral-400)',
  TODAY: 'var(--color-orange-400)',
  FUTURE: 'var(--color-blue-400)',
};

const DATE_STATUS_OPTIONS = TABLE_RESERVATION_DATE_STATUSES.map((value) => ({
  value,
  label: dateStatusLabel[value],
}));

// Module-scoped so its reference stays stable for the memoised filter.
const getReservationDateStatus = (
  reservation: RestaurantReservation,
): RestaurantReservationDateStatus => getRestaurantReservationDateStatus(reservation.start);

const getColumns = (
  tables: RestaurantTable[],
  customersById: Map<string, Customer>,
  locale: Locale,
): ColumnDef<RestaurantReservation>[] => [
  {
    id: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = getRestaurantReservationDateStatus(row.original.start);
      return <StatusIndicator color={dateStatusColor[status]} label={dateStatusLabel[status]} />;
    },
  },
  {
    id: 'customer',
    header: 'Customer',
    cell: ({ row }) => {
      const customer = row.original.customerId
        ? customersById.get(row.original.customerId)
        : undefined;
      return customer ? customer.name || customer.email : '';
    },
  },
  {
    accessorKey: 'start',
    header: ({ column }) => (
      <Button
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="btn-ghost -mx-4"
      >
        Start
        {column.getIsSorted() === 'asc' ? (
          <ArrowUpIcon />
        ) : column.getIsSorted() === 'desc' ? (
          <ArrowDownIcon />
        ) : (
          <SortIcon />
        )}
      </Button>
    ),
    cell: ({ row }) => formatDateTime(new Date(row.original.start), locale),
  },
  {
    id: 'end',
    header: 'End',
    cell: ({ row }) => formatDateTime(getRestaurantReservationEnd(row.original.start), locale),
  },
  {
    accessorKey: 'numberOfPeople',
    header: 'People',
  },
  {
    accessorKey: 'tableId',
    header: 'Table',
    cell: ({ row }) => {
      const table = tables.find((t) => t.id === row.original.tableId);
      return table ? table.number : (row.original.tableId ?? '—');
    },
  },
];

export const RestaurantReservationsTable = ({
  user,
  navigate,
}: {
  user: User;
  navigate: (page: Page, id?: string) => void;
}) => {
  const restaurantReservations = useRestaurantReservations();
  const tables = useRestaurantTables();
  const customers = useCustomers();
  const { selected, toggle, filtered } = useToggleFilter(
    restaurantReservations,
    DATE_STATUS_OPTIONS,
    getReservationDateStatus,
  );

  const customersById = React.useMemo(
    () => new Map(customers.map((customer) => [customer.id, customer])),
    [customers],
  );

  const locale = user.locale ?? DEFAULT_LOCALE;
  const columns = React.useMemo(
    () => getColumns(tables, customersById, locale),
    [tables, customersById, locale],
  );

  const table = useReactTable({
    data: filtered,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      sorting: [{ id: 'created', desc: true }],
      pagination: { pageSize: 20 },
    },
  });

  return (
    <div className="flex flex-col gap-4 w-full px-4 py-6">
      <PageHeader icon={<TableBookingIcon className="size-5" />} title="Table reservations">
        {canPerform(user.role, 'TABLE_RESERVATION', 'CREATE') && (
          <Button
            onClick={() => navigate('table-reservation-detail', 'new')}
            className="ml-auto rounded-full hover:cursor-pointer"
            aria-label="Add table reservation"
          >
            <AddIcon />
          </Button>
        )}
      </PageHeader>

      <div className="hidden">
        <FilterBar options={DATE_STATUS_OPTIONS} selected={selected} onToggle={toggle} />
      </div>

      <Section>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} variant="header">
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
                  onClick={() => navigate('table-reservation-detail', row.original.id)}
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
                  No table reservations.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Section>

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
