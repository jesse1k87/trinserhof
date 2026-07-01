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
  InvoiceIcon,
  PageHeader,
  Section,
  SortIcon,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@trinserhof/ui';
import { formatCurrency, formatDate, formatRelativeDate } from '@trinserhof/helpers';
import {
  Booking,
  canPerform,
  Customer,
  DEFAULT_LOCALE,
  Invoice,
  type Locale,
  Product,
  type User,
} from '@trinserhof/types';
import { type Page } from 'src/types/page';
import useInvoices from 'src/hooks/useInvoices';
import useCustomers from 'src/hooks/useCustomers';
import useProducts from 'src/hooks/useProducts';
import useBookings from 'src/hooks/useBookings';
import { getInvoiceTotal } from 'src/helpers/invoiceLineItems';

const customerLabel = (customer: Customer | undefined): string =>
  customer
    ? [customer.name, customer.surname].filter(Boolean).join(' ') || customer.email || '—'
    : '—';

const getColumns = (
  customersById: Map<string, Customer>,
  bookingsById: Map<string, Booking>,
  productsById: Map<string, Product>,
  locale: Locale,
): ColumnDef<Invoice>[] => [
  {
    accessorKey: 'number',
    header: ({ column }) => (
      <Button
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="btn-ghost -mx-4"
      >
        Invoice
        {column.getIsSorted() === 'asc' ? (
          <ArrowUpIcon />
        ) : column.getIsSorted() === 'desc' ? (
          <ArrowDownIcon />
        ) : (
          <SortIcon />
        )}
      </Button>
    ),
    cell: ({ row }) => <span className="font-medium">{row.original.number}</span>,
  },
  {
    accessorKey: 'created',
    header: ({ column }) => (
      <Button
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="btn-ghost -mx-4"
      >
        Created
        {column.getIsSorted() === 'asc' ? (
          <ArrowUpIcon />
        ) : column.getIsSorted() === 'desc' ? (
          <ArrowDownIcon />
        ) : (
          <SortIcon />
        )}
      </Button>
    ),
    cell: ({ row }) => {
      if (!row.original.created) return '—';
      const created = new Date(row.original.created);
      return <span title={formatDate(created, locale)}>{formatRelativeDate(created)}</span>;
    },
  },
  {
    id: 'customer',
    header: 'Customer',
    cell: ({ row }) => customerLabel(customersById.get(row.original.customerId)),
  },
  {
    id: 'bookings',
    header: 'Bookings',
    cell: ({ row }) => row.original.bookingIds?.length ?? 0,
  },
  {
    id: 'total',
    header: () => <div className="text-right">Total</div>,
    cell: ({ row }) => (
      <div className="text-right">
        {formatCurrency(getInvoiceTotal(row.original, bookingsById, productsById), 2, locale)}
      </div>
    ),
  },
];

export const InvoicesTable = ({
  user,
  navigate,
}: {
  user: User;
  navigate: (nextPage: Page, id?: string) => void;
}) => {
  const invoices = useInvoices();
  const customers = useCustomers();
  const products = useProducts();
  const bookings = useBookings();

  const customersById = React.useMemo(
    () => new Map(customers.map((customer) => [customer.id, customer])),
    [customers],
  );
  const bookingsById = React.useMemo(
    () => new Map(bookings.map((booking) => [booking.id, booking])),
    [bookings],
  );
  const productsById = React.useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  );
  const locale = user.locale ?? DEFAULT_LOCALE;
  const columns = React.useMemo(
    () => getColumns(customersById, bookingsById, productsById, locale),
    [customersById, bookingsById, productsById, locale],
  );

  const table = useReactTable({
    data: invoices,
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
      <PageHeader icon={<InvoiceIcon className="size-5" />} title="Invoices">
        {canPerform(user.role, 'INVOICE', 'CREATE') && (
          <Button
            onClick={() => navigate('invoice-edit', 'new')}
            className="ml-auto rounded-full hover:cursor-pointer"
            aria-label="Add invoice"
          >
            <AddIcon />
          </Button>
        )}
      </PageHeader>

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
                  onClick={() => navigate('invoice-detail', row.original.id)}
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
                  No invoices.
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
