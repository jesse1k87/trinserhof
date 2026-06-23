import { type Room } from '@trinserhof/types';

export const getNewRoom = (): Room => ({
  id: '',
  type: 'STANDARD_DOUBLE',
  label: '',
  description: '',
  pricePerNight: 0,
});
