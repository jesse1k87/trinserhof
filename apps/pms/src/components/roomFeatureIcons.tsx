import * as React from 'react';
import {
  BathtubIcon,
  BedIcon as KingBedIcon,
  BedIcon as QueenBedIcon,
  SingleBedIcon,
  BalconyIcon,
  SpacesIcon,
  MountainViewIcon,
  PhoneIcon,
  ShowerIcon,
  SleepSofaIcon,
  DeskIcon,
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
  bathtub: BathtubIcon,
  toilet: ToiletIcon,
  phone: PhoneIcon,
  desk: DeskIcon,
  mountainView: MountainViewIcon,
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
  singleBed: SingleBedIcon,
  kingBed: KingBedIcon,
  queenBed: QueenBedIcon,
  sleepSofa: SleepSofaIcon,
  spaces: SpacesIcon,
};
