import * as React from 'react';
import { Booking, PRICE_PET_PER_NIGHT, RoomTypeId } from '@trinserhof/types';
import { formatCurrency, getCityTax, getStayPriceBreakdown } from '@trinserhof/helpers';
import { HorizontalLine, Label } from '@trinserhof/ui';
import usePrices from '../hooks/usePrices';

export const PriceSummary = ({
  booking,
  roomType,
  onChange,
}: {
  booking: Booking;
  roomType: RoomTypeId | undefined;
  onChange: (booking: Booking) => void;
}) => {
  const prices = usePrices();

  const priceBreakdown = getStayPriceBreakdown(prices, roomType, booking.checkIn, booking.checkOut);

  // The booking stores its own pricePerNight (editable below) rather than always
  // recomputing from the room type's base price/overrides, which can change later.
  // Seed it from the resolved price the first time a room with a known price is picked.
  React.useEffect(() => {
    if (booking.pricePerNight === undefined && priceBreakdown.nights[0]?.price !== undefined) {
      onChange({ ...booking, pricePerNight: priceBreakdown.nights[0].price });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomType, priceBreakdown.nights[0]?.price]);

  const nightCount = priceBreakdown.nights.length;

  const total =
    booking.pricePerNight !== undefined ? booking.pricePerNight * nightCount : undefined;

  const cityTax = getCityTax(booking, nightCount);

  const petsCost = booking.pets * nightCount * PRICE_PET_PER_NIGHT;

  const tax = total !== undefined ? (total + petsCost) * 0.1 : undefined;

  const grossTotal = total !== undefined ? total + petsCost + (tax ?? 0) + cityTax : undefined;

  return (
    <div className="flex flex-col w-full grid gap-3 rounded-md border p-3">
      <div className="flex flex-row items-center justify-between">
        <div className="flex w-full flex-col">
          <Label htmlFor="label">{roomType}</Label>
          <div className="pt-1 text-xs text-muted-foreground">
            {nightCount} x{' '}
            {booking.pricePerNight !== undefined ? formatCurrency(booking.pricePerNight) : '...'}{' '}
            per night
          </div>
        </div>
        <span className="text-sm">
          {nightCount > 0 && total !== undefined ? formatCurrency(total) : '—'}
        </span>
      </div>

      {nightCount > 0 && booking.pets > 0 && (
        <div className="flex flex-row items-center justify-between">
          <div className="flex w-full flex-col">
            <Label htmlFor="label">{booking.pets === 1 ? 'Pet' : 'Pets'}</Label>
            <div className="pt-1 text-xs text-muted-foreground">
              {booking.pets} x {formatCurrency(PRICE_PET_PER_NIGHT)} p.p.p.n.
            </div>
          </div>
          <div className="text-sm">{formatCurrency(petsCost)}</div>
        </div>
      )}

      <HorizontalLine />

      <div className="flex flex-row items-center justify-between">
        <div className="flex w-full flex-col">
          <Label htmlFor="label">Subtotal</Label>
          <div className="pt-1 text-xs text-muted-foreground"></div>
        </div>
        <span className="text-sm">{total ? formatCurrency(total + petsCost) : '...'}</span>
      </div>

      {nightCount > 0 && (
        <div className="flex flex-row items-center justify-between">
          <div className="flex w-full flex-col">
            <Label htmlFor="label">VAT</Label>
            <div className="pt-1 text-xs text-muted-foreground">10%</div>
          </div>
          <span className="text-sm">{tax !== undefined ? formatCurrency(tax) : '—'}</span>
        </div>
      )}

      {nightCount > 0 && (
        <div className="flex flex-row items-center justify-between">
          <div className="flex w-full flex-col">
            <Label htmlFor="label">City tax</Label>
            <div className="pt-1 text-xs text-muted-foreground">{nightCount} x € 2,60 p.p.p.n.</div>
          </div>
          <span className="text-sm">{formatCurrency(cityTax)}</span>
        </div>
      )}

      {nightCount > 0 && (
        <div className="flex flex-row items-center justify-between pt-1">
          <span className="text-sm">Total</span>
          <span className="text-base font-semibold">
            {grossTotal !== undefined ? formatCurrency(grossTotal) : '—'}
          </span>
        </div>
      )}

      {!(roomType && nightCount > 0) && (
        <div className="text-xs text-muted-foreground">
          {!roomType
            ? 'Assign a room to calculate the price.'
            : 'Select a date range to calculate the price.'}
        </div>
      )}

      {nightCount > 0 && booking.pricePerNight === undefined && total && (
        <div className="text-xs text-destructive">
          {roomType
            ? `No base price set for ${roomType}. Set it on the Prices page, or enter a price per night above.`
            : 'No base price set for this room type. Set it on the Prices page, or enter a price per night above.'}
        </div>
      )}
    </div>
  );
};
