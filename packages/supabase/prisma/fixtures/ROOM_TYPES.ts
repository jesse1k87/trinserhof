import { RoomType } from '@trinserhof/types';

export const ROOM_TYPES: RoomType[] = [
  {
    id: 'SUITE',
    label: 'Suite',
    description: 'Spacious suite with a separate sitting area.',
    basePrice: 165,
  },
  {
    id: 'STANDARD',
    label: 'Standard',
    description: 'Comfortable standard double room.',
    basePrice: 149,
  },
  {
    id: 'BERGSTEIGER',
    label: 'Bergsteiger',
    description: 'Cosy room for mountaineers.',
    basePrice: 135,
  },
  {
    id: 'FAMILY',
    label: 'Family',
    description: 'Larger room that sleeps a family.',
    basePrice: 149,
  },
];
