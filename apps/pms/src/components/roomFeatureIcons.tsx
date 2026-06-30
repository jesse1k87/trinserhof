import * as React from 'react';
import { ICONS } from '@trinserhof/ui';
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
  balcony: ICONS.balcony,
  tv: ICONS.tv,
  shower: ICONS.shower,
  bathtub: ICONS.bath,
  toilet: ICONS.toilet,
  phone: ICONS.phone,
  desk: ICONS.desk,
  mountainView: ICONS.mountain,
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
  singleBed: ICONS.bedSingle,
  kingBed: ICONS.bedKing,
  queenBed: ICONS.bedQueen,
  sleepSofa: ICONS.sofa,
  spaces: ICONS.space,
};
