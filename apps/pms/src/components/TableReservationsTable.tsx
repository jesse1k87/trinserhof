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
import {
  formatDateTime,
  getNewTableReservation,
  getTableReservationDateStatus,
  TABLE_RESERVATION_DATE_STATUSES,
  type TableReservationDateStatus,
} from '@trinserhof/helpers';
import {
  canPerform,
  type Customer,
  getTableReservationEnd,
  type RestaurantTable,
  type TableReservation,
  type User,
} from '@trinserhof/types';
import {
  ArrowDown as ArrowDownIcon,
  ArrowUp as ArrowUpIcon,
  ChevronsUpDown as CaretSortIcon,
  Clock as ClockIcon,
  Plus as PlusIcon,
} from 'lucide-react';
import { TableReservationContext } from 'src/context/TableReservationContext';
import { FilterBar } from 'src/components/FilterBar';
import useCustomers from 'src/hooks/useCustomers';
import useTableReservations from 'src/hooks/useTableReservations';
import useTables from 'src/hooks/useTables';
import { useToggleFilter } from 'src/hooks/useToggleFilter';

const dateStatusLabel: Record<TableReservationDateStatus, string> = {
  PAST: 'Past',
  TODAY: 'Today',
  FUTURE: 'Future',
};

const dateStatusColor: Record<TableReservationDateStatus, string> = {
  PAST: 'var(--color-neutral-400)',
  TODAY: 'var(--color-orange-400)',
  FUTURE: 'var(--color-blue-400)',
};

const DATE_STATUS_OPTIONS = TABLE_RESERVATION_DATE_STATUSES.map((value) => ({
  value,
  label: dateStatusLabel[value],
}));

// Module-scoped so its reference stays stable for the memoised filter.
const getReservationDateStatus = (reservation: TableReservation): TableReservationDateStatus =>
  getTableReservationDateStatus(reservation.start);

const getColumns = (
  tables: RestaurantTable[],
  customersById: Map<string, Customer>,
): ColumnDef<TableReservation>[] => [
  {
    id: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = getTableReservationDateStatus(row.original.start);
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
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="-mx-3 hover:cursor-pointer"
      >
        Start
        {column.getIsSorted() === 'asc' ? (
          <ArrowUpIcon />
        ) : column.getIsSorted() === 'desc' ? (
          <ArrowDownIcon />
        ) : (
          <CaretSortIcon />
        )}
      </Button>
    ),
    cell: ({ row }) => formatDateTime(new Date(row.original.start)),
  },
  {
    id: 'end',
    header: 'End',
    cell: ({ row }) => formatDateTime(getTableReservationEnd(row.original.start)),
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
      return table ? table.number : row.original.tableId;
    },
  },
];

export const TableReservationsTable = ({ user }: { user: User }) => {
  const tableReservations = useTableReservations();
  const tables = useTables();
  const customers = useCustomers();
  const [, setTableReservation] = React.useContext(TableReservationContext);
  const { selected, toggle, filtered } = useToggleFilter(
    tableReservations,
    DATE_STATUS_OPTIONS,
    getReservationDateStatus,
  );

  const customersById = React.useMemo(
    () => new Map(customers.map((customer) => [customer.id, customer])),
    [customers],
  );

  const columns = React.useMemo(
    () => getColumns(tables, customersById),
    [tables, customersById],
  );

  const table = useReactTable({
    data: filtered,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      sorting: [{ id: 'start', desc: false }],
      pagination: { pageSize: 20 },
    },
  });

  return (
    <div className="flex flex-col gap-4 w-full max-w-5xl px-4 py-6">
      <PageHeader icon={<ClockIcon className="size-5" />} title="Table reservations">
        {canPerform(user.role, 'TABLE_RESERVATION', 'CREATE') && (
          <Button
            size="icon"
            onClick={() => setTableReservation(getNewTableReservation())}
            className="ml-auto rounded-full hover:cursor-pointer"
            aria-label="Add table reservation"
          >
            <PlusIcon />
          </Button>
        )}
      </PageHeader>

      <div className="hidden">
        <FilterBar options={DATE_STATUS_OPTIONS} selected={selected} onToggle={toggle} />
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
                  onClick={() => setTableReservation(row.original)}
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
