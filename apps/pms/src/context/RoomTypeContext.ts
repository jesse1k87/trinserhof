import { RoomType } from '@trinserhof/types';
import * as React from 'react';

export type RoomTypeContextType = RoomType | null;

export type RoomTypeContextValue = [
  RoomTypeContextType,
  React.Dispatch<React.SetStateAction<RoomTypeContextType>>,
];

export const RoomTypeContext = React.createContext<RoomTypeContextValue>([null, () => {}]);
