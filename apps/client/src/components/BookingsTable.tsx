import * as React from 'react';
import useCollection from '../hooks/useBookings';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Booking } from '@bookings/types';
import { formatCurrency, formatDate } from '@bookings/helpers';

export function BookingsTable() {
  const bookings = useCollection('bookings');

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Status</TableHead>
          <TableHead>Room</TableHead>
          <TableHead>Check in</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>E-mail</TableHead>
          <TableHead className="w-[600px]">Message</TableHead>
          <TableHead className="text-right">Price</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {bookings.map((booking: Booking) => (
          <TableRow key={booking.id}>
            <TableCell>{booking.status}</TableCell>
            <TableCell>{booking.roomId}</TableCell>
            <TableCell className="text-right">
              {formatDate(new Date(booking.checkIn))} - {formatDate(new Date(booking.checkOut))}
            </TableCell>
            <TableCell>{booking.name}</TableCell>
            <TableCell>{booking.email}</TableCell>
            <TableCell>{booking.message}</TableCell>
            <TableCell className="text-right">{formatCurrency(booking.price)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
