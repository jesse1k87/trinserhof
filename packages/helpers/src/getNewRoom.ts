import { type Room } from '@trinserhof/types';

export const getNewRoom = (): Room => ({
  id: '',
  type: 'STANDARD',
  maxCustomers: 2,
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
  sofa: 0,
  sleepSofa: 0,
  spaces: 0,
});
