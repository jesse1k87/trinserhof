import { Booking, OldBooking } from '@bookings/types';

export const convertToNewBooking = (old: OldBooking) => {
  //   if (old.id === 'd0575b81-249c-4d95-8b1d-307a103764b9') {
  //     console.log('🟠 Jesse: ~ convertToNewBooking ~ old:', old);
  //   }

  const newBooking: Booking = {
    id: old.id,
    created: old.created,
    email: old.contact,
    name:
      old.content && old.content !== ''
        ? old.content
        : old.name && old.name !== ''
          ? old.name
          : old.contact && old.contact !== ''
            ? old.contact
            : 'Unknown',
    message: old.content,
    notes: `Name: ${old.name}. Contact: ${old.contact}. Content: ${old.content}. Price: ${old.price}. Status: ${old.status}.`,
    status:
      old.status === 'confirmed'
        ? 'CONFIRMED'
        : old.status === 'maybe'
          ? 'PENDING'
          : old.status === 'employee'
            ? 'BLOCKED'
            : old.deleted
              ? 'DECLINED'
              : 'PENDING',
    checkIn: old.start,
    checkOut: old.end,
    roomType: undefined,
    roomId: `${old.group}`,
    adults: 0,
    children: 0,
    pets: 0,
    price: 0,
    priceFixed: 0,
  };
  return newBooking;
};
