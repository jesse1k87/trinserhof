import { z } from 'zod';
import { RoomTypeId } from './room';

// Pricing is resolved per room type, per night:
//   - `base` is each room type's default nightly price - a fallback only, sourced
//     from `RoomType.basePrice` (see packages/supabase/prisma/schema.prisma).
//   - `overrides` holds the Prices table's per-night rows (`Price.base`, always
//     tied to a `date`), keyed by night (YYYY-MM-DD) then by room type. A row
//     here wins over the room type's base price for that night.
//
// A room type without a base price (and without a Price-table row for a given
// night) simply has no known price for that night - the UI treats that as "not set".

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

const roomTypePriceMapSchema = z.record(z.string(), priceAmountSchema);

export const pricesSchema = z.object({
  base: roomTypePriceMapSchema,
  overrides: z.record(z.string(), roomTypePriceMapSchema),
});
