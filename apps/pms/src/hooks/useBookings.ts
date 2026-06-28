import * as React from 'react';
import { getSupabaseClient, toUtcIso, type Booking as BookingRow } from '@trinserhof/supabase';
import { Booking } from '@trinserhof/types';

const toBooking = (row: BookingRow): Booking => ({
  id: row.id,
  created: toUtcIso(row.created),
  origin: row.origin,
  status: row.status,
  checkIn: row.checkIn,
  checkOut: row.checkOut,
  cancelled: row.cancelled ? toUtcIso(row.cancelled) : undefined,
  confirmed: row.confirmed ? toUtcIso(row.confirmed) : undefined,
  checkedIn: row.checkedIn ? toUtcIso(row.checkedIn) : undefined,
  checkedOut: row.checkedOut ? toUtcIso(row.checkedOut) : undefined,
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

    getSupabaseClient()
      .from('Booking')
      .select('*')
      .then(({ data, error }: { data: BookingRow[] | null; error: unknown }) => {
        if (error) throw error;
        if (active) {
          setBookings((data ?? []).map(toBooking));
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
