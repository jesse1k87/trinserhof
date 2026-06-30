import { type Room } from '@trinserhof/types';

export const getNewRoom = (): Room => ({
  id: '',
  type: 'STANDARD',
  // Assigned by the caller (the RoomDetailPage picks the property the room
  // belongs to) before the room is saved.
  propertyId: '',
  maxCustomers: 2,
  floor: 0,
  color: '#3b82f6',
  balcony: false,
  tv: false,
  shower: false,
  bathtub: false,
  toilet: false,
  phone: false,
  desk: false,
  mountainView: false,
  singleBed: 0,
  kingBed: 0,
  queenBed: 0,
  sleepSofa: 0,
  spaces: 1,
});
