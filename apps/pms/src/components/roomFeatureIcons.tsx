import * as React from 'react';
import {
  BalconyIcon,
  BathIcon,
  BedKingIcon,
  BedQueenIcon,
  BedSingleIcon,
  DeskIcon,
  MountainIcon,
  PhoneIcon,
  ShowerIcon,
  SofaIcon,
  SpaceIcon,
  ToiletIcon,
  TvIcon,
} from '@trinserhof/ui';
import type { RoomAmenity, RoomBedCount } from '@trinserhof/types';

export const ROOM_AMENITY_LABELS: Record<RoomAmenity, string> = {
  balcony: 'Balcony',
  tv: 'TV',
  shower: 'Shower',
  bathtub: 'Bathtub',
  toilet: 'Toilet',
  phone: 'Phone',
  desk: 'Desk',
  mountainView: 'Mountain view',
};

export const ROOM_AMENITY_ICONS: Record<
  RoomAmenity,
  React.ComponentType<React.SVGProps<SVGSVGElement>>
> = {
  balcony: BalconyIcon,
  tv: TvIcon,
  shower: ShowerIcon,
  bathtub: BathIcon,
  toilet: ToiletIcon,
  phone: PhoneIcon,
  desk: DeskIcon,
  mountainView: MountainIcon,
};

export const ROOM_BED_COUNT_LABELS: Record<RoomBedCount, string> = {
  singleBed: 'Single bed',
  kingBed: 'King bed',
  queenBed: 'Queen bed',
  sleepSofa: 'Sleep sofa',
  spaces: 'Spaces',
};

export const ROOM_BED_COUNT_ICONS: Record<
  RoomBedCount,
  React.ComponentType<React.SVGProps<SVGSVGElement>>
> = {
  singleBed: BedSingleIcon,
  kingBed: BedKingIcon,
  queenBed: BedQueenIcon,
  sleepSofa: SofaIcon,
  spaces: SpaceIcon,
};
