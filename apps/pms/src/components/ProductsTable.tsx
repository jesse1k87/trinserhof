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
import { formatCurrency, getNewProduct } from '@trinserhof/helpers';
import { canPerform, Product, type User } from '@trinserhof/types';
import {
  Archive as ArchiveIcon,
  ArrowDown as ArrowDownIcon,
  ArrowUp as ArrowUpIcon,
  ChevronsUpDown as CaretSortIcon,
  Plus as PlusIcon,
} from 'lucide-react';
import { ProductContext } from 'src/context/ProductContext';
import useProducts from 'src/hooks/useProducts';
import useAccountingCategories from 'src/hooks/useAccountingCategories';

const getColumns = (categoryNamesById: Map<string, string>): ColumnDef<Product>[] => [
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
    accessorKey: 'accountingCategoryId',
    header: 'Accounting category',
    cell: ({ row }) =>
      (row.original.accountingCategoryId &&
        categoryNamesById.get(row.original.accountingCategoryId)) ||
      '—',
  },
  {
    accessorKey: 'price',
    header: 'Price',
    cell: ({ row }) => formatCurrency(row.original.price),
  },
];

export const ProductsTable = ({ user }: { user: User }) => {
  const products = useProducts();
  const categories = useAccountingCategories();
  const [, setProduct] = React.useContext(ProductContext);

  const categoryNamesById = React.useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories],
  );
  const columns = React.useMemo(() => getColumns(categoryNamesById), [categoryNamesById]);

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
      <PageHeader icon={<ArchiveIcon className="size-5" />} title="Products">
        {canPerform(user.role, 'PRODUCT', 'CREATE') && (
          <Button
            size="icon"
            onClick={() => setProduct(getNewProduct())}
            className="ml-auto rounded-full hover:cursor-pointer"
            aria-label="Add product"
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
                  onClick={() => setProduct(row.original)}
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
