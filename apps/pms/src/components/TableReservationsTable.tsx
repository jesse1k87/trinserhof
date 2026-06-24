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
import { formatDateTime, getNewTableReservation } from '@trinserhof/helpers';
import {
  canPerform,
  type RestaurantTable,
  type TableReservation,
  type User,
} from '@trinserhof/types';
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CaretSortIcon,
  ClockIcon,
  PlusIcon,
} from '@radix-ui/react-icons';
import { TableReservationContext } from 'src/context/TableReservationContext';
import useTableReservations from 'src/hooks/useTableReservations';
import useTables from 'src/hooks/useTables';

const getColumns = (tables: RestaurantTable[]): ColumnDef<TableReservation>[] => [
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
    accessorKey: 'end',
    header: 'End',
    cell: ({ row }) => formatDateTime(new Date(row.original.end)),
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
      return table ? `${table.name} (${table.nickname})` : row.original.tableId;
    },
  },
];

export const TableReservationsTable = ({ user }: { user: User }) => {
  const tableReservations = useTableReservations();
  const tables = useTables();
  const [, setTableReservation] = React.useContext(TableReservationContext);

  const columns = React.useMemo(() => getColumns(tables), [tables]);

  const table = useReactTable({
    data: tableReservations,
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
