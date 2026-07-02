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
  Section,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@trinserhof/ui';
import {
  AuditEvent,
  AuditLogEntry,
  DEFAULT_LOCALE,
  type Locale,
  type User,
} from '@trinserhof/types';
import { ArrowDownIcon, ArrowUpIcon, AuditLogIcon, SortIcon } from '@trinserhof/ui';
import useAuditLog from 'src/hooks/useAuditLog';

// The shared formatDate helper is date-only; the audit log needs the time too.
const formatTimestamp = (timestamp: number, locale: Locale) =>
  Number.isFinite(timestamp)
    ? new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(timestamp))
    : '—';

const EVENT_LABELS: Record<AuditEvent, string> = {
  LOGIN: 'Login',
  LOGOUT: 'Logout',
  BOOKING_CREATED: 'Booking created',
  BOOKING_UPDATED: 'Booking updated',
  BOOKING_RESTORED: 'Booking restored',
  CUSTOMER_CREATED: 'Customer created',
  CUSTOMER_UPDATED: 'Customer updated',
  CUSTOMERS_MERGED: 'Customers merged',
  INVOICE_CREATED: 'Invoice created',
  INVOICE_UPDATED: 'Invoice updated',
  ROLE_CREATED: 'Role created',
  ROLE_UPDATED: 'Role updated',
  ROOM_CREATED: 'Room created',
  ROOM_UPDATED: 'Room updated',
  ROOM_TYPE_CREATED: 'Room type created',
  ROOM_TYPE_UPDATED: 'Room type updated',
  PRICE_BASE_UPDATED: 'Base price updated',
  PRICE_OVERRIDE_SET: 'Night price set',
  PRICE_OVERRIDE_REMOVED: 'Night price reset',
  TABLE_CREATED: 'Table created',
  TABLE_UPDATED: 'Table updated',
  TABLE_RESERVATION_CREATED: 'Table reservation created',
  TABLE_RESERVATION_UPDATED: 'Table reservation updated',
  PRODUCT_CREATED: 'Product created',
  PRODUCT_UPDATED: 'Product updated',
  PRODUCT_RESTORED: 'Product restored',
  ACCOUNTING_CATEGORY_CREATED: 'Accounting category created',
  ACCOUNTING_CATEGORY_UPDATED: 'Accounting category updated',
  ACCOUNTING_CATEGORY_RESTORED: 'Accounting category restored',
  MIGRATE_LEGACY_BOOKINGS: 'Migrate legacy bookings',
  BOOKINGS_WIPED: 'Bookings deleted',
  BOOKINGS_IMPORTED: 'Bookings imported',
  CUSTOMERS_WIPED: 'Customers deleted',
  ROOMS_WIPED: 'Rooms deleted',
  ROLES_AND_USERS_WIPED: 'Roles and users deleted',
  PROPERTY_CREATED: 'Property created',
  PROPERTY_UPDATED: 'Property updated',
};

const OUTLINE_EVENTS: AuditEvent[] = ['LOGOUT'];

const getColumns = (locale: Locale): ColumnDef<AuditLogEntry>[] => [
  {
    accessorKey: 'timestamp',
    header: ({ column }) => (
      <Button
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="btn-ghost -mx-4"
      >
        Date and time
        {column.getIsSorted() === 'asc' ? (
          <ArrowUpIcon />
        ) : column.getIsSorted() === 'desc' ? (
          <ArrowDownIcon />
        ) : (
          <SortIcon />
        )}
      </Button>
    ),
    cell: ({ row }) => formatTimestamp(row.original.timestamp, locale),
  },
  {
    accessorKey: 'email',
    header: ({ column }) => (
      <Button
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="btn-ghost -mx-4"
      >
        Email
        {column.getIsSorted() === 'asc' ? (
          <ArrowUpIcon />
        ) : column.getIsSorted() === 'desc' ? (
          <ArrowDownIcon />
        ) : (
          <SortIcon />
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

export const AuditLog = ({ user }: { user: User }) => {
  const entries = useAuditLog();
  const locale = user.locale ?? DEFAULT_LOCALE;
  const columns = React.useMemo(() => getColumns(locale), [locale]);

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
    <div className="flex flex-col gap-4 w-full px-4 py-6">
      <PageHeader icon={<AuditLogIcon className="size-5" />} title="Activity Log" />

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
