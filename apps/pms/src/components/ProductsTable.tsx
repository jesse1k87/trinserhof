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
  ICONS,
  PageHeader,
  StatusIndicator,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@trinserhof/ui';
import { formatCurrency } from '@trinserhof/helpers';
import { AccountingCategory, canPerform, Product, type User } from '@trinserhof/types';
import { type Page } from 'src/types/page';
import useProducts from 'src/hooks/useProducts';
import useAccountingCategories from 'src/hooks/useAccountingCategories';

const getColumns = (categoriesById: Map<string, AccountingCategory>): ColumnDef<Product>[] => [
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
          <ICONS.arrowUp />
        ) : column.getIsSorted() === 'desc' ? (
          <ICONS.arrowDown />
        ) : (
          <ICONS.sort />
        )}
      </Button>
    ),
  },
  {
    accessorKey: 'accountingCategoryId',
    header: 'Accounting category',
    cell: ({ row }) => {
      const category = categoriesById.get(row.original.accountingCategoryId);
      return category ? <StatusIndicator color={category.color} label={category.name} /> : '—';
    },
  },
  {
    accessorKey: 'price',
    header: 'Price',
    cell: ({ row }) => formatCurrency(row.original.price),
  },
];

export const ProductsTable = ({
  user,
  navigate,
}: {
  user: User;
  navigate: (page: Page, id?: string) => void;
}) => {
  const products = useProducts();
  const categories = useAccountingCategories();

  const categoriesById = React.useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  );
  const columns = React.useMemo(() => getColumns(categoriesById), [categoriesById]);

  const table = useReactTable({
    data: products,
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
      <PageHeader icon={<ICONS.product className="size-5" />} title="Products">
        {canPerform(user.role, 'PRODUCT', 'CREATE') && (
          <Button
            size="icon"
            onClick={() => navigate('product-detail', 'new')}
            className="ml-auto rounded-full hover:cursor-pointer"
            aria-label="Add product"
          >
            <ICONS.add />
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
                  onClick={() => navigate('product-detail', row.original.id)}
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
                  No products.
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
