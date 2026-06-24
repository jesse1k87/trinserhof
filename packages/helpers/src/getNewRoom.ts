import { type Room } from '@trinserhof/types';

export const getNewRoom = (): Room => ({
  id: '',
  type: 'STANDARD',
  label: 'Standard',
});
