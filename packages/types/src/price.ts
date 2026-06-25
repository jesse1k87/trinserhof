import { z } from 'zod';
import { RoomTypeId, RoomTypeIdEnum } from './room';

// Pricing lives in Firebase under a single `prices` node:
//   prices/base/<roomTypeId>                     = number  (base price per night for a room type)
//   prices/overrides/<YYYY-MM-DD>/<roomTypeId>   = number  (price for that specific night, overrides the base)
//
// A room type without a base price (and without an override for a given night)
// simply has no known price for that night - the UI treats that as "not set".

export type RoomTypePriceMap = Partial<Record<RoomTypeId, number>>;

export type Prices = {
  base: RoomTypePriceMap;
  // Keyed by night (YYYY-MM-DD), then by room type.
  overrides: Record<string, RoomTypePriceMap>;
};

export const EMPTY_PRICES: Prices = { base: {}, overrides: {} };

// A price amount is a non-negative, finite number (euros).
export const priceAmountSchema = z
  .number({ message: 'Price must be a number' })
  .finite({ message: 'Price must be a finite number' })
  .nonnegative({ message: 'Price must not be negative' });

const roomTypePriceMapSchema = z.record(RoomTypeIdEnum, priceAmountSchema);

export const pricesSchema = z.object({
  base: roomTypePriceMapSchema,
  overrides: z.record(z.string(), roomTypePriceMapSchema),
});
