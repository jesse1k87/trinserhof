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
  PageHeader,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@trinserhof/ui';
import { AuditEvent, AuditLogEntry } from '@trinserhof/types';
import {
  ScrollText as ActivityLogIcon,
  ArrowDown as ArrowDownIcon,
  ArrowUp as ArrowUpIcon,
  ChevronsUpDown as CaretSortIcon,
} from 'lucide-react';
import useAuditLog from 'src/hooks/useAuditLog';

// The shared formatDate helper is date-only; the audit log needs the time too.
const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const formatTimestamp = (timestamp: number) =>
  Number.isFinite(timestamp) ? dateTimeFormatter.format(new Date(timestamp)) : '—';

const EVENT_LABELS: Record<AuditEvent, string> = {
  LOGIN: 'Login',
  LOGOUT: 'Logout',
  BOOKING_CREATED: 'Booking created',
  BOOKING_UPDATED: 'Booking updated',
  BOOKING_DELETED: 'Booking deleted',
  BOOKING_RESTORED: 'Booking restored',
  CUSTOMER_CREATED: 'Customer created',
  CUSTOMER_UPDATED: 'Customer updated',
  CUSTOMERS_MERGED: 'Customers merged',
  ROOM_CREATED: 'Room created',
  ROOM_UPDATED: 'Room updated',
  ROOM_DELETED: 'Room deleted',
  PRICE_BASE_UPDATED: 'Base price updated',
  PRICE_OVERRIDE_SET: 'Night price set',
  PRICE_OVERRIDE_REMOVED: 'Night price reset',
  TABLE_CREATED: 'Table created',
  TABLE_UPDATED: 'Table updated',
  TABLE_DELETED: 'Table deleted',
  TABLE_RESERVATION_CREATED: 'Table reservation created',
  TABLE_RESERVATION_UPDATED: 'Table reservation updated',
  TABLE_RESERVATION_DELETED: 'Table reservation deleted',
  PRODUCT_CREATED: 'Product created',
  PRODUCT_UPDATED: 'Product updated',
  PRODUCT_DELETED: 'Product deleted',
  PRODUCT_RESTORED: 'Product restored',
  ACCOUNTING_CATEGORY_CREATED: 'Accounting category created',
  ACCOUNTING_CATEGORY_UPDATED: 'Accounting category updated',
  ACCOUNTING_CATEGORY_DELETED: 'Accounting category deleted',
  ACCOUNTING_CATEGORY_RESTORED: 'Accounting category restored',
  MIGRATE_LEGACY_BOOKINGS: 'Migrate legacy bookings',
  BOOKINGS_WIPED: 'Bookings deleted',
  BOOKINGS_IMPORTED: 'Bookings imported',
};

const OUTLINE_EVENTS: AuditEvent[] = [
  'LOGOUT',
  'BOOKING_DELETED',
  'ROOM_DELETED',
  'PRODUCT_DELETED',
];

const columns: ColumnDef<AuditLogEntry>[] = [
  {
    accessorKey: 'timestamp',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="-mx-3 hover:cursor-pointer"
      >
        Date and time
        {column.getIsSorted() === 'asc' ? (
          <ArrowUpIcon />
        ) : column.getIsSorted() === 'desc' ? (
          <ArrowDownIcon />
        ) : (
          <CaretSortIcon />
        )}
      </Button>
    ),
    cell: ({ row }) => formatTimestamp(row.original.timestamp),
  },
  {
    accessorKey: 'email',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="-mx-3 hover:cursor-pointer"
      >
        Email
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
    accessorKey: 'event',
    header: 'Event',
    cell: ({ row }) => (
      <Badge variant={OUTLINE_EVENTS.includes(row.original.event) ? 'outline' : 'default'}>
        {EVENT_LABELS[row.original.event]}
      </Badge>
    ),
  },
];

export const AuditLog = () => {
  const entries = useAuditLog();

  const table = useReactTable({
    data: entries,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      sorting: [{ id: 'timestamp', desc: true }],
      pagination: { pageSize: 20 },
    },
  });

  return (
    <div className="flex flex-col gap-4 w-full max-w-5xl px-4 py-6">
      <PageHeader icon={<ActivityLogIcon className="size-5" />} title="Audit Log" />

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
                  No audit log entries yet.
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
