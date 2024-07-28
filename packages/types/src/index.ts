export { formSchema } from './formSchema';

export const petPricePerNight = 15;

export type Guest = 'Adult' | 'Child' | 'Pet';

export type RoomType = 'SUITE' | 'STANDARD_DOUBLE' | 'BASIC_DOUBLE' | 'SINGLE' | 'FAMILY';

export const ROOMS: Array<{
  type: RoomType;
  pricePerNight: number;
  label: string;
  description: string;
}> = [
  {
    type: 'SUITE',
    label: 'Suite',
    pricePerNight: 155,
    description: 'Double room for 2 guests with 1 or 2 bathrooms.',
  },
  {
    type: 'STANDARD_DOUBLE',
    pricePerNight: 135,
    label: 'Standard Double Room',
    description: 'Double room for 2 guests with bathroom.',
  },
  {
    type: 'BASIC_DOUBLE',
    pricePerNight: 115,
    label: 'Basic Double Room',
    description: 'Single room for 2 guests with bathroom.',
  },
  {
    type: 'SINGLE',
    pricePerNight: 75,
    label: 'Basic Single Room',
    description: 'Single room for 1 guest.',
  },
  {
    type: 'FAMILY',
    pricePerNight: 0,
    label: 'Family Room',
    description: 'Double room for 4 guests (2 or 3 beds).',
  },
];

export type BookingStatus = 'DRAFT' | 'PENDING' | 'CONFIRMED' | 'PAID' | 'DECLINED';

export const STATUSES: Record<BookingStatus, BookingStatus> = {
  DRAFT: 'DRAFT',
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  PAID: 'PAID',
  DECLINED: 'DECLINED',
};
export type Booking = {
  id: string;
  created: string;
  email: string;
  message: string;
  status: BookingStatus;
  checkIn: string;
  checkOut: string;
  roomType: RoomType;
  adults: number;
  children: number;
  pets: number;
  price: number;
};
