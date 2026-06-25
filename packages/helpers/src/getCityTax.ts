import { Booking, CITY_TAX_PER_GUEST_PER_NIGHT } from '@trinserhof/types';

// City tax is per guest (adults + children) per night - it is computed
// at runtime for display only and never persisted on the booking.
export const getCityTax = (booking: Pick<Booking, 'adults' | 'children'>, nights: number) =>
  (booking.adults + booking.children) * nights * CITY_TAX_PER_GUEST_PER_NIGHT;
