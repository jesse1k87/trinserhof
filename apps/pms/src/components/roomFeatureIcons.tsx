import * as React from 'react';
import {
  Bath as BathtubIcon,
  BedDouble as DoubleBedIcon,
  BedSingle as SingleBedIcon,
  Coffee as BreakfastIncludedIcon,
  DoorOpen as BalconyIcon,
  Droplet as ToiletIcon,
  Flame as SaunaIcon,
  Maximize2 as SpacesIcon,
  Mountain as MountainViewIcon,
  ParkingCircle as FreeParkingIcon,
  Phone as PhoneIcon,
  ShowerHead as ShowerIcon,
  Sofa as SofaIcon,
  Table2 as DeskIcon,
  Trees as GardenIcon,
  Tv as TvIcon,
  Armchair as SleepSofaIcon,
  Waves as OutdoorPoolIcon,
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
  freeParking: 'Free parking',
  sauna: 'Sauna',
  breakfastIncluded: 'Breakfast included',
  outdoorPool: 'Outdoor pool',
  garden: 'Garden',
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
  freeParking: FreeParkingIcon,
  sauna: SaunaIcon,
  breakfastIncluded: BreakfastIncludedIcon,
  outdoorPool: OutdoorPoolIcon,
  garden: GardenIcon,
  mountainView: MountainViewIcon,
};

export const ROOM_BED_COUNT_LABELS: Record<RoomBedCount, string> = {
  singleBed: 'Single bed',
  doubleBed: 'Double bed',
  sofa: 'Sofa',
  sleepSofa: 'Sleep sofa',
  spaces: 'Spaces',
};

export const ROOM_BED_COUNT_ICONS: Record<
  RoomBedCount,
  React.ComponentType<React.SVGProps<SVGSVGElement>>
> = {
  singleBed: SingleBedIcon,
  doubleBed: DoubleBedIcon,
  sofa: SofaIcon,
  sleepSofa: SleepSofaIcon,
  spaces: SpacesIcon,
};
