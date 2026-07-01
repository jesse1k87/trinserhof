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
  Section,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@trinserhof/ui';
import { canPerform, AccountingCategory, type User } from '@trinserhof/types';
import {
  AccountingCategoryIcon,
  AddIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  SortIcon,
} from '@trinserhof/ui';
import { type Page } from 'src/types/page';
import useAccountingCategories from 'src/hooks/useAccountingCategories';

const columns: ColumnDef<AccountingCategory>[] = [
  {
    accessorKey: 'color',
    header: '',
    cell: ({ row }) => (
      <span
        className="inline-block size-4 rounded-full border border-base-300"
        style={{ backgroundColor: row.original.color }}
      />
    ),
  },
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <Button
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="btn-ghost -mx-4"
      >
        Accounting category
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
    accessorKey: 'taxRate',
    header: 'Tax rate',
    cell: ({ row }) => `${row.original.taxRate}%`,
  },
];

export const AccountingCategoriesTable = ({
  user,
  navigate,
}: {
  user: User;
  navigate: (page: Page, id?: string) => void;
}) => {
  const categories = useAccountingCategories();

  const table = useReactTable({
    data: categories,
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
    <div className="flex flex-col gap-4 w-full px-4 py-6">
      <PageHeader
        icon={<AccountingCategoryIcon className="size-5" />}
        title="Accounting categories"
      >
        {canPerform(user.role, 'ACCOUNTING_CATEGORY', 'CREATE') && (
          <Button
            onClick={() => navigate('accounting-category-detail', 'new')}
            className="ml-auto rounded-full hover:cursor-pointer"
            aria-label="Add accounting category"
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
                  onClick={() => navigate('accounting-category-detail', row.original.id)}
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
                  No product categories.
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
