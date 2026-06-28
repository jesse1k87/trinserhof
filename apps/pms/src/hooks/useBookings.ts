import * as React from 'react';
import { getDb, type Booking as BookingRow } from '@trinserhof/supabase';
import { Booking } from '@trinserhof/types';

const toBooking = (row: BookingRow): Booking => ({
  id: row.id,
  created: row.created.toISOString(),
  origin: row.origin,
  status: row.status,
  checkIn: row.checkIn.toISOString().slice(0, 10),
  checkOut: row.checkOut.toISOString().slice(0, 10),
  cancelled: row.cancelled?.toISOString(),
  confirmed: row.confirmed?.toISOString(),
  checkedIn: row.checkedIn?.toISOString(),
  checkedOut: row.checkedOut?.toISOString(),
  roomId: row.roomId,
  customers: row.customers,
  adults: row.adults,
  children: row.children,
  pets: row.pets,
  pricePerNight: row.pricePerNight ?? undefined,
});

const useBookings = () => {
  const [bookings, setBookings] = React.useState<Booking[]>([]);

  React.useEffect(() => {
    let active = true;

    getDb()
      .booking.findMany()
      .then((rows: BookingRow[]) => {
        if (active) {
          setBookings(rows.map(toBooking));
        }
      })
      .catch((error: unknown) => {
        console.error(error);
      });

    return () => {
      active = false;
    };
  }, []);

  return bookings;
};

export default useBookings;
