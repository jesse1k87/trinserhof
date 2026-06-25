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
import { getNewRoom } from '@trinserhof/helpers';
import { canPerform, ROOM_AMENITIES, Room, type User } from '@trinserhof/types';
import {
  ArrowDown as ArrowDownIcon,
  ArrowUp as ArrowUpIcon,
  ChevronsUpDown as CaretSortIcon,
  House as HomeIcon,
  Plus as PlusIcon,
} from 'lucide-react';
import { RoomContext } from 'src/context/RoomContext';
import useRooms from 'src/hooks/useRooms';
import { ROOM_AMENITY_ICONS, ROOM_AMENITY_LABELS } from 'src/components/roomFeatureIcons';

const columns: ColumnDef<Room>[] = [
  {
    accessorKey: 'id',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="-mx-3 hover:cursor-pointer"
      >
        Room number
        {column.getIsSorted() === 'asc' ? (
          <ArrowUpIcon />
        ) : column.getIsSorted() === 'desc' ? (
          <ArrowDownIcon />
        ) : (
          <CaretSortIcon />
        )}
      </Button>
    ),
    sortingFn: (a, b) => Number(a.original.id) - Number(b.original.id),
  },
  {
    accessorKey: 'type',
    header: 'Type',
  },
  {
    accessorKey: 'maxCustomers',
    header: 'Max customers',
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
                className="size-4 text-muted-foreground"
                aria-label={ROOM_AMENITY_LABELS[amenity]}
              />
              {!hasAmenity && (
                <span
                  aria-hidden="true"
                  className="absolute inset-0 rotate-45 border-t border-muted-foreground"
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

export const RoomsTable = ({ user }: { user: User }) => {
  const rooms = useRooms();
  const [, setRoom] = React.useContext(RoomContext);

  const table = useReactTable({
    data: rooms,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      sorting: [
        { id: 'type', desc: false },
        { id: 'id', desc: false },
      ],
      pagination: { pageSize: 20 },
    },
  });

  return (
    <div className="flex flex-col gap-4 w-full max-w-5xl px-4 py-6">
      <PageHeader icon={<HomeIcon className="size-5" />} title="Rooms">
        {canPerform(user.role, 'ROOM', 'CREATE') && (
          <Button
            size="icon"
            onClick={() => setRoom(getNewRoom())}
            className="ml-auto rounded-full hover:cursor-pointer"
            aria-label="Add room"
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
                  onClick={() => setRoom(row.original)}
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
