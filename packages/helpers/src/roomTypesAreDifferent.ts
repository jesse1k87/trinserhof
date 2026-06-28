import { RoomType } from '@trinserhof/types';

export const roomTypesAreDifferent = (a: RoomType, b: RoomType) =>
  a.label !== b.label || (a.description ?? '') !== (b.description ?? '');
