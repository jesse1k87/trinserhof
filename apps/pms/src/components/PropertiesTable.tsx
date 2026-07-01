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
  PropertyIcon,
  SortIcon,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@trinserhof/ui';
import { canPerform, DEFAULT_LOCALE, type Locale, Property, type User } from '@trinserhof/types';
import { type Page } from 'src/types/page';
import useProperties from 'src/hooks/useProperties';
import { formatCurrency } from '@trinserhof/helpers';

const getColumns = (locale: Locale): ColumnDef<Property>[] => [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <Button
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="-mx-3 hover:cursor-pointer"
      >
        Property
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
    accessorKey: 'legalName',
    header: 'Legal name',
    cell: ({ row }) => (
      <span className="text-base-content/60">{row.original.legalName || '—'}</span>
    ),
  },
  {
    accessorKey: 'phone',
    header: 'Phone',
    cell: ({ row }) => <span className="text-base-content/60">{row.original.phone || '—'}</span>,
  },
  {
    accessorKey: 'cityTaxPerPersonPerNight',
    header: 'City tax / person / night',
    cell: ({ row }) => formatCurrency(row.original.cityTaxPerPersonPerNight, 2, locale),
  },
];

export const PropertiesTable = ({
  user,
  navigate,
}: {
  user: User;
  navigate: (page: Page, id?: string) => void;
}) => {
  const properties = useProperties();
  const locale = user.locale ?? DEFAULT_LOCALE;
  const columns = React.useMemo(() => getColumns(locale), [locale]);

  const table = useReactTable({
    data: properties,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      sorting: [{ id: 'name', desc: false }],
      pagination: { pageSize: 20 },
    },
  });

  return (
    <div className="flex flex-col gap-4 w-full max-w-5xl px-4 py-6">
      <PageHeader icon={<PropertyIcon className="size-5" />} title="Properties">
        {canPerform(user.role, 'PROPERTY', 'CREATE') && (
          <Button
            onClick={() => navigate('property-detail', 'new')}
            className="ml-auto rounded-full hover:cursor-pointer"
            aria-label="Add property"
          >
            <AddIcon />
          </Button>
        )}
      </PageHeader>

      <div className="rounded-md">
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
                  onClick={() => navigate('property-detail', row.original.id)}
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
                  No properties.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

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
