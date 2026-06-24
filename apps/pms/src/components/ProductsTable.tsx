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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@trinserhof/ui';
import { formatCurrency, getNewProduct } from '@trinserhof/helpers';
import { canCreateBooking, Product, type User } from '@trinserhof/types';
import {
  ArchiveIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  CaretSortIcon,
  PlusIcon,
} from '@radix-ui/react-icons';
import { ProductContext } from 'src/context/ProductContext';
import useProducts from 'src/hooks/useProducts';
import useProductCategories from 'src/hooks/useProductCategories';

const getColumns = (categoryNamesById: Map<string, string>): ColumnDef<Product>[] => [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="-mx-3 hover:cursor-pointer"
      >
        Product
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
    accessorKey: 'description',
    header: 'Description',
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.description || '—'}</span>
    ),
  },
  {
    accessorKey: 'categoryId',
    header: 'Category',
    cell: ({ row }) =>
      (row.original.categoryId && categoryNamesById.get(row.original.categoryId)) || '—',
  },
  {
    accessorKey: 'price',
    header: 'Price',
    cell: ({ row }) => formatCurrency(row.original.price),
  },
];

export const ProductsTable = ({ user }: { user: User }) => {
  const products = useProducts();
  const categories = useProductCategories();
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
      <div className="flex items-center gap-2 justify-between">
        <ArchiveIcon className="size-5" />
        <h1 className="text-lg font-semibold">Products</h1>
        {canCreateBooking(user.role) && (
          <Button
            size="icon"
            onClick={() => setProduct(getNewProduct())}
            className="rounded-full hover:cursor-pointer"
            aria-label="Add product"
          >
            <PlusIcon />
          </Button>
        )}
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
