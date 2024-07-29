export { formSchema } from './formSchema';

export const petPricePerNight = 15;

export type Guest = 'Adult' | 'Child' | 'Pet';

export type RoomType = 'SUITE' | 'STANDARD_DOUBLE' | 'BASIC_DOUBLE' | 'SINGLE' | 'FAMILY';

export const ROOM_TYPE_IDS: Record<RoomType, RoomType> = {
  SUITE: 'SUITE',
  STANDARD_DOUBLE: 'STANDARD_DOUBLE',
  BASIC_DOUBLE: 'BASIC_DOUBLE',
  SINGLE: 'SINGLE',
  FAMILY: 'FAMILY',
};

export const ROOM_TYPES: Array<{
  type: RoomType;
  pricePerNight: number;
  label: string;
  description: string;
}> = [
  {
    type: 'SUITE',
    label: 'Suite',
    description: 'Double room for 2 guests with 1 or 2 bathrooms.',
    pricePerNight: 155,
  },
  {
    type: 'STANDARD_DOUBLE',
    label: 'Standard Double Room',
    description: 'Double room for 2 guests with bathroom.',
    pricePerNight: 135,
  },
  {
    type: 'BASIC_DOUBLE',
    label: 'Basic Double Room',
    description: 'Single room for 2 guests with bathroom.',
    pricePerNight: 115,
  },
  {
    type: 'SINGLE',
    label: 'Basic Single Room',
    description: 'Single room for 1 guest.',
    pricePerNight: 75,
  },
  {
    type: 'FAMILY',
    label: 'Family Room',
    description: 'Double room for 4 guests (2 or 3 beds).',
    pricePerNight: 0,
  },
];

const getLabel = (type: RoomType) => ROOM_TYPES.find((t) => t.type === type)?.label ?? '';

export const ROOMS: Array<{ id: string; type: RoomType; label: string }> = [
  {
    id: '101',
    type: 'STANDARD_DOUBLE',
    label: getLabel('STANDARD_DOUBLE'),
  },
  {
    id: '102',
    type: 'SINGLE',
    label: getLabel('SINGLE'),
  },
  {
    id: '103',
    type: 'BASIC_DOUBLE',
    label: getLabel('BASIC_DOUBLE'),
  },
  {
    id: '104',
    type: 'SUITE',
    label: getLabel('SUITE'),
  },
  {
    id: '106',
    type: 'BASIC_DOUBLE',
    label: getLabel('BASIC_DOUBLE'),
  },
  {
    id: '107',
    type: 'BASIC_DOUBLE',
    label: getLabel('BASIC_DOUBLE'),
  },
  {
    id: '108',
    type: 'BASIC_DOUBLE',
    label: getLabel('BASIC_DOUBLE'),
  },
  {
    id: '109',
    type: 'BASIC_DOUBLE',
    label: getLabel('BASIC_DOUBLE'),
  },
  {
    id: '110',
    type: 'SINGLE',
    label: getLabel('SINGLE'),
  },
  {
    id: '111',
    type: 'STANDARD_DOUBLE',
    label: getLabel('STANDARD_DOUBLE'),
  },
  {
    id: '112',
    type: 'BASIC_DOUBLE',
    label: getLabel('BASIC_DOUBLE'),
  },
  {
    id: '113',
    type: 'BASIC_DOUBLE',
    label: getLabel('BASIC_DOUBLE'),
  },
  {
    id: '114',
    type: 'SUITE',
    label: getLabel('SUITE'),
  },
  {
    id: '116',
    type: 'BASIC_DOUBLE',
    label: getLabel('BASIC_DOUBLE'),
  },
  {
    id: '117',
    type: 'BASIC_DOUBLE',
    label: getLabel('BASIC_DOUBLE'),
  },
  {
    id: '118',
    type: 'BASIC_DOUBLE',
    label: getLabel('BASIC_DOUBLE'),
  },
  {
    id: '119',
    type: 'SUITE',
    label: getLabel('SUITE'),
  },
  {
    id: '121',
    type: 'FAMILY',
    label: getLabel('FAMILY'),
  },
  {
    id: '124',
    type: 'FAMILY',
    label: getLabel('FAMILY'),
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

export type Channel = 'EMAIL' | 'PHONE' | 'AIRBNB' | 'BOOKING';

export const CHANNELS: Record<Channel, Channel> = {
  EMAIL: 'EMAIL',
  PHONE: 'PHONE',
  AIRBNB: 'AIRBNB',
  BOOKING: 'BOOKING',
};

export type Booking = {
  id: string;
  created: string;
  channel: Channel;
  email: string;
  name: string;
  notes: string;
  message: string;
  status: BookingStatus;
  checkIn: string;
  checkOut: string;
  roomType: RoomType | undefined;
  roomId: string | undefined;
  adults: number;
  children: number;
  pets: number;
  price: number;
  priceFixed: number;
};

export type OldBooking = {
  className: string;
  contact: string;
  content: string;
  created: string;
  deleted: boolean;
  end: string;
  group: string;
  id: string;
  name: string;
  price: string;
  start: string;
  status: string;
  updated: string;
};
