export { formSchema } from './formSchema';

export const petPricePerNight = 15;

export type Guest = 'Adult' | 'Child' | 'Pet';

export type Room = {
  id:
    | '101'
    | '102'
    | '103'
    | '104'
    | '106'
    | '107'
    | '108'
    | '109'
    | '110'
    | '111'
    | '112'
    | '113'
    | '114'
    | '116'
    | '117'
    | '118'
    | '119'
    | '121'
    | '124';
  type: 'SUITE' | 'STANDARD_DOUBLE' | 'BASIC_DOUBLE' | 'SINGLE' | 'FAMILY';
};

export const ROOM_TYPES: Array<{
  type: Room['type'];
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

export type BookingStatus = 'DRAFT' | 'PENDING' | 'CONFIRMED' | 'PAID' | 'DECLINED' | 'BLOCKED';

export const STATUSES: Record<BookingStatus, BookingStatus> = {
  DRAFT: 'DRAFT',
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  PAID: 'PAID',
  DECLINED: 'DECLINED',
  BLOCKED: 'BLOCKED',
};
export type Booking = {
  id: string;
  created: string;
  email: string;
  message: string;
  status: BookingStatus;
  checkIn: string;
  checkOut: string;
  roomType: Room['type'];
  roomId: Room['id'] | undefined;
  adults: number;
  children: number;
  pets: number;
  price: number;
};

export const ROOM_IDS: Array<Room['id']> = [
  '101',
  '102',
  '103',
  '104',
  '106',
  '107',
  '108',
  '109',
  '110',
  '111',
  '112',
  '113',
  '114',
  '116',
  '117',
  '118',
  '119',
  '121',
  '124',
];
