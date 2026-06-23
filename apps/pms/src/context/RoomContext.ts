import { Room } from '@trinserhof/types';
import * as React from 'react';

export type RoomContextType = Room | null;

export type RoomContextValue = [
  RoomContextType,
  React.Dispatch<React.SetStateAction<RoomContextType>>,
];

export const RoomContext = React.createContext<RoomContextValue>([null, () => {}]);
