import { RoomTypeId } from '@trinserhof/types';

export const BASE_PRICES: Array<{ roomType: RoomTypeId; amount: number }> = [
  { roomType: 'SUITE', amount: 165 },
  { roomType: 'STANDARD', amount: 149 },
  { roomType: 'BERGSTEIGER', amount: 135 },
  { roomType: 'FAMILY', amount: 149 },
];
