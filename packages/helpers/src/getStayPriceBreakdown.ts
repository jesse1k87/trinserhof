import { Prices, RoomTypeId } from '@trinserhof/types';
import { getNightsInDateRange } from './getNightsInDateRange';

export type StayNightPrice = {
  date: string; // YYYY-MM-DD
  // `undefined` when neither an override nor a base price is set for that night.
  price: number | undefined;
  isOverride: boolean;
};

export type StayPriceBreakdown = {
  nights: StayNightPrice[];
  // Sum of the nights that have a known price.
  total: number;
  // At least one night used a per-night override.
  hasOverride: boolean;
  // At least one night has no price set (neither override nor base).
  hasUnknownPrice: boolean;
};

// Resolves the effective price for a single room type on a single night: a
// per-night override wins over the room type's base price. Returns `undefined`
// when neither is set.
export const getRoomTypePriceForDate = (
  prices: Prices,
  roomType: RoomTypeId,
  date: string,
): { price: number | undefined; isOverride: boolean } => {
  const override = prices.overrides?.[date]?.[roomType];
  if (typeof override === 'number') {
    return { price: override, isOverride: true };
  }
  const base = prices.base?.[roomType];
  return { price: typeof base === 'number' ? base : undefined, isOverride: false };
};

// Builds the per-night price breakdown (and total) for a stay in a given room
// type, applying base prices and per-night overrides across the date range.
export const getStayPriceBreakdown = (
  prices: Prices,
  roomType: RoomTypeId | undefined,
  checkIn: string,
  checkOut: string,
): StayPriceBreakdown => {
  if (!roomType) {
    return { nights: [], total: 0, hasOverride: false, hasUnknownPrice: false };
  }

  const nights = getNightsInDateRange(checkIn, checkOut).map((date) => {
    const { price, isOverride } = getRoomTypePriceForDate(prices, roomType, date);
    return { date, price, isOverride };
  });

  return {
    nights,
    total: nights.reduce((sum, night) => sum + (night.price ?? 0), 0),
    hasOverride: nights.some((night) => night.isOverride),
    hasUnknownPrice: nights.some((night) => night.price === undefined),
  };
};
