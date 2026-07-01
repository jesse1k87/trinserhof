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
import { canPerform, ROOM_AMENITIES, ROOM_BED_COUNTS, Room, type User } from '@trinserhof/types';
import { type Page } from 'src/types/page';
import useRooms from 'src/hooks/useRooms';
import {
  ROOM_AMENITY_ICONS,
  ROOM_AMENITY_LABELS,
  ROOM_BED_COUNT_ICONS,
  ROOM_BED_COUNT_LABELS,
} from 'src/components/roomFeatureIcons';

const columns: ColumnDef<Room>[] = [
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
    accessorKey: 'id',
    header: ({ column }) => (
      <Button
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="-mx-3 hover:cursor-pointer"
      >
        No.
        {column.getIsSorted() === 'asc' ? (
          <ICONS.arrowUp />
        ) : column.getIsSorted() === 'desc' ? (
          <ICONS.arrowDown />
        ) : (
          <ICONS.sort />
        )}
      </Button>
    ),
    sortingFn: (a, b) => a.original.id.localeCompare(b.original.id, undefined, { numeric: true }),
  },
  {
    accessorKey: 'type',
    header: 'Type',
  },
  {
    accessorKey: 'maxCustomers',
    header: 'Guests',
    cell: ({ row }) => (
      <div className="flex flex-row gap-1">
        {Array.from({ length: row.original.maxCustomers }).map((_, index) => (
          <ICONS.user key={index} className="size-4 text-base-content/60" aria-label="Customer" />
        ))}
      </div>
    ),
  },
  {
    accessorKey: 'floor',
    header: 'Floor',
  },
  {
    id: 'beds',
    header: 'Beds',
    cell: ({ row }) => (
      <div className="flex flex-row gap-1.5">
        {ROOM_BED_COUNTS.filter((bedCount) => bedCount !== 'spaces' && row.original[bedCount]).map(
          (bedCount) => {
            const Icon = ROOM_BED_COUNT_ICONS[bedCount];
            return (
              <span key={bedCount} className="flex items-center gap-0.5">
                <Icon
                  className="size-4 text-base-content/60"
                  aria-label={ROOM_BED_COUNT_LABELS[bedCount]}
                />
                <span className="text-xs text-base-content/60">{row.original[bedCount]}</span>
              </span>
            );
          },
        )}
      </div>
    ),
  },
  {
    id: 'spaces',
    header: 'Spaces',
    cell: ({ row }) => {
      const Icon = ROOM_BED_COUNT_ICONS.spaces;
      const count = row.original.spaces ?? 0;
      return (
        <div className="flex flex-row gap-1">
          {Array.from({ length: count }).map((_, index) => (
            <Icon
              key={index}
              className="size-4 text-base-content/60"
              aria-label={ROOM_BED_COUNT_LABELS.spaces}
            />
          ))}
        </div>
      );
    },
  },
  {
    id: 'amenities',
    header: 'Amenities',
    cell: ({ row }) => (
      <div className="flex flex-row gap-1.5">
        {ROOM_AMENITIES.map((amenity) => {
          const Icon = ROOM_AMENITY_ICONS[amenity];
          const hasAmenity = Boolean(row.original[amenity]);
          return (
            <span key={amenity} className="relative inline-flex">
              <Icon
                className="size-4 text-base-content/60"
                style={!hasAmenity ? { opacity: 0.2 } : undefined}
                aria-label={ROOM_AMENITY_LABELS[amenity]}
              />
              {!hasAmenity && (
                <span
                  aria-hidden="true"
                  className="absolute inset-0 -rotate-45 border-t border-muted-foreground opacity-100"
                  style={{ top: '50%' }}
                />
              )}
            </span>
          );
        })}
      </div>
    ),
  },
];

export const RoomsTable = ({
  user,
  navigate,
}: {
  user: User;
  navigate: (page: Page, id?: string) => void;
}) => {
  const rooms = useRooms();

  const table = useReactTable({
    data: rooms,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      sorting: [{ id: 'id', desc: false }],
      pagination: { pageSize: 20 },
    },
  });

  return (
    <div className="flex flex-col gap-4 w-full max-w-5xl px-4 py-6">
      <PageHeader icon={<ICONS.room className="size-5" />} title="Rooms">
        {canPerform(user.role, 'ROOM', 'CREATE') && (
          <Button
            onClick={() => navigate('room-detail', 'new')}
            className="ml-auto rounded-full hover:cursor-pointer"
            aria-label="Add room"
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
                  onClick={() => navigate('room-detail', row.original.id)}
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
                  No rooms.
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
