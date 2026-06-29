import * as React from 'react';
import {
  type ColumnDef,
  type RowSelectionState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  Button,
  Checkbox,
  Input,
  PageHeader,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@trinserhof/ui';
import { canMergeCustomers, canPerform, type Customer, type User } from '@trinserhof/types';
import { type Page } from 'src/types/page';

import {
  ArrowDownIcon,
  ArrowUpIcon,
  CaretSortIcon,
  MapIcon,
  MergeIcon,
  UserIcon as PersonIcon,
  PlusIcon,
  SearchIcon,
} from '@trinserhof/ui';
import useCustomers from 'src/hooks/useCustomers';
import { formatDate, fuzzyMatch } from '@trinserhof/helpers';
import { MergeCustomersDialog } from './MergeCustomersDialog';

const selectColumn: ColumnDef<Customer> = {
  id: 'select',
  enableSorting: false,
  header: () => null,
  cell: ({ row }) => (
    <Checkbox
      checked={row.getIsSelected()}
      onCheckedChange={(value) => row.toggleSelected(Boolean(value))}
      aria-label="Select customer"
    />
  ),
};

const columns: ColumnDef<Customer>[] = [
  {
    accessorKey: 'surname',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="-mx-3 hover:cursor-pointer"
      >
        Surname
        {column.getIsSorted() === 'asc' ? (
          <ArrowUpIcon />
        ) : column.getIsSorted() === 'desc' ? (
          <ArrowDownIcon />
        ) : (
          <CaretSortIcon />
        )}
      </Button>
    ),
    cell: ({ row }) => row.original.surname || '—',
  },
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
    cell: ({ row }) => row.original.name || row.original.email,
  },

  {
    accessorKey: 'email',
    header: 'Email',
  },
  {
    accessorKey: 'phone',
    header: 'Phone',
    cell: ({ row }) => row.original.phone || '—',
  },
  {
    accessorKey: 'dateOfBirth',
    header: 'Date of birth',
    cell: ({ row }) =>
      row.original.dateOfBirth ? formatDate(new Date(row.original.dateOfBirth)) : '—',
  },
  {
    accessorKey: 'created',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="-mx-3 hover:cursor-pointer"
      >
        Created
        {column.getIsSorted() === 'asc' ? (
          <ArrowUpIcon />
        ) : column.getIsSorted() === 'desc' ? (
          <ArrowDownIcon />
        ) : (
          <CaretSortIcon />
        )}
      </Button>
    ),
    cell: ({ row }) => (row.original.created ? formatDate(new Date(row.original.created)) : '—'),
  },
  {
    id: 'address',
    header: 'Address',
    cell: ({ row }) => {
      const { street, streetNumber, postcode, city, country } = row.original;
      const line1 = [street, streetNumber].filter(Boolean).join(' ');
      const line2 = [postcode, city].filter(Boolean).join(' ');
      const address = [line1, line2, country].filter(Boolean).join(', ');
      return address || '—';
    },
  },
];

export const CustomersTable = ({
  user,
  navigate,
}: {
  user: User;
  navigate: (nextPage: Page, id?: string) => void;
}) => {
  const customers = useCustomers();

  const canUpdateCustomers = canPerform(user.role, 'CUSTOMER', 'UPDATE');

  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [isMergeOpen, setIsMergeOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');

  const tableColumns = React.useMemo(
    () => (canUpdateCustomers ? [selectColumn, ...columns] : columns),
    [canUpdateCustomers],
  );

  const filteredCustomers = React.useMemo(
    () =>
      customers.filter(
        (customer) =>
          fuzzyMatch(customer.name ?? '', search) ||
          fuzzyMatch(customer.surname ?? '', search) ||
          fuzzyMatch(customer.email ?? '', search),
      ),
    [customers, search],
  );

  const table = useReactTable({
    data: filteredCustomers,
    columns: tableColumns,
    getRowId: (customer) => customer.id,
    enableRowSelection: canUpdateCustomers,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: { rowSelection },
    initialState: {
      sorting: [{ id: 'name', desc: false }],
      pagination: { pageSize: 20 },
    },
  });

  const selectedCustomers = table.getSelectedRowModel().rows.map((row) => row.original);
  const canShowMerge = canMergeCustomers(user.role) && selectedCustomers.length === 2;

  return (
    <div className="flex flex-col gap-4 w-full max-w-5xl px-4 py-6">
      <PageHeader icon={<PersonIcon className="size-5" />} title="Guests">
        <div className="ml-auto flex items-center gap-2">
          {canPerform(user.role, 'PAGE_CUSTOMER_MAP', 'READ') && (
            <Button
              variant="outline"
              onClick={() => navigate('customer-map')}
              className="hover:cursor-pointer"
            >
              <MapIcon className="size-4" />
              Customer map
            </Button>
          )}
          {canPerform(user.role, 'PAGE_CUSTOMER_MERGE_SUGGESTIONS', 'READ') && (
            <>
              <Button
                variant="outline"
                onClick={() => navigate('customer-merge-suggestions')}
                className="hover:cursor-pointer"
              >
                <MergeIcon className="size-4" />
                Duplicate suggestions
              </Button>
              {canShowMerge && (
                <Button
                  variant="outline"
                  onClick={() => setIsMergeOpen(true)}
                  className="hover:cursor-pointer"
                >
                  <MergeIcon className="size-4" />
                  Merge
                </Button>
              )}
            </>
          )}

          {canPerform(user.role, 'CUSTOMER', 'CREATE') && (
            <Button
              size="icon"
              onClick={() => navigate('customer-detail', 'new')}
              className="rounded-full hover:cursor-pointer"
              aria-label="Add customer"
            >
              <PlusIcon />
            </Button>
          )}
        </div>
      </PageHeader>

      <div className="relative w-full max-w-sm">
        <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search customers..."
          className="pl-6"
        />
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
                  onClick={() => navigate('customer-detail', row.original.id)}
                  className="cursor-pointer"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      onClick={
                        cell.column.id === 'select' ? (event) => event.stopPropagation() : undefined
                      }
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={tableColumns.length} className="h-24 text-center">
                  No customers.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {table.getPageCount() > 1 && (
        <div className="flex items-center justify-end gap-2">
          <span className="text-sm text-muted-foreground">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1} (
            {table.getFilteredRowModel().rows.length} total)
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

      {canShowMerge && isMergeOpen && (
        <MergeCustomersDialog
          customers={[selectedCustomers[0], selectedCustomers[1]]}
          user={user}
          onOpenChange={setIsMergeOpen}
          onMerged={() => {
            setRowSelection({});
            setIsMergeOpen(false);
          }}
        />
      )}
    </div>
  );
};
