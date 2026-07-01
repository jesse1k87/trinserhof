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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@trinserhof/ui';
import { canPerform, DEFAULT_LOCALE, type Locale, RoomType, type User } from '@trinserhof/types';
import { type Page } from 'src/types/page';
import useRoomTypes from 'src/hooks/useRoomTypes';
import { formatCurrency } from '@trinserhof/helpers';

const getColumns = (locale: Locale): ColumnDef<RoomType>[] => [
  {
    accessorKey: 'label',
    header: ({ column }) => (
      <Button
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="-mx-3 hover:cursor-pointer"
      >
        Room type
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
    accessorKey: 'id',
    header: 'Code',
    cell: ({ row }) => (
      <span className="font-mono text-xs text-base-content/60">{row.original.id}</span>
    ),
  },
  {
    accessorKey: 'description',
    header: 'Description',
    cell: ({ row }) => (
      <span className="text-base-content/60">{row.original.description || '—'}</span>
    ),
  },
  {
    accessorKey: 'basePrice',
    header: 'Base price',
    cell: ({ row }) => formatCurrency(row.original.basePrice, 2, locale),
  },
];

export const RoomTypesTable = ({
  user,
  navigate,
}: {
  user: User;
  navigate: (page: Page, id?: string) => void;
}) => {
  const roomTypes = useRoomTypes();
  const locale = user.locale ?? DEFAULT_LOCALE;
  const columns = React.useMemo(() => getColumns(locale), [locale]);

  const table = useReactTable({
    data: roomTypes,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      sorting: [{ id: 'label', desc: false }],
      pagination: { pageSize: 20 },
    },
  });

  return (
    <div className="flex flex-col gap-4 w-full max-w-5xl px-4 py-6">
      <PageHeader icon={<ICONS.roomType className="size-5" />} title="Room types">
        {canPerform(user.role, 'ROOM_TYPE', 'CREATE') && (
          <Button
            onClick={() => navigate('room-type-detail', 'new')}
            className="ml-auto rounded-full hover:cursor-pointer"
            aria-label="Add room type"
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
                  onClick={() => navigate('room-type-detail', row.original.id)}
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
                  No room types.
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
