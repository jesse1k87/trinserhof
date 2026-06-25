import * as React from 'react';
import {
  Bath as BathtubIcon,
  BedDouble as KingBedIcon,
  BedDouble as QueenBedIcon,
  BedSingle as SingleBedIcon,
  DoorOpen as BalconyIcon,
  Maximize2 as SpacesIcon,
  Mountain as MountainViewIcon,
  Phone as PhoneIcon,
  ShowerHead as ShowerIcon,
  Sofa as SofaIcon,
  Table2 as DeskIcon,
  Toilet as ToiletIcon,
  Tv as TvIcon,
  Armchair as SleepSofaIcon,
} from 'lucide-react';
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
  sofa: 'Sofa',
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
  sofa: SofaIcon,
  sleepSofa: SleepSofaIcon,
  spaces: SpacesIcon,
};
