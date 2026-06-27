import * as React from 'react';
import { PRICE_PET_PER_NIGHT, RoomTypeId } from '@trinserhof/types';
import { formatCurrency } from '@trinserhof/helpers';

export const PriceSummary = ({
  nightCount,
  pricePerNight,
  total,
  pets,
  petsCost,
  tax,
  cityTax,
  grossTotal,
  hasSelectedRoom,
  hasUnknownPrice,
  roomType,
}: {
  nightCount: number;
  pricePerNight: number | undefined;
  total: number | undefined;
  pets: number;
  petsCost: number;
  tax: number | undefined;
  cityTax: number;
  grossTotal: number | undefined;
  hasSelectedRoom: boolean;
  hasUnknownPrice: boolean;
  roomType: RoomTypeId | undefined;
}) => (
  <div className="flex flex-col w-full grid gap-3 rounded-md border p-3">
    <div className="flex flex-row items-center justify-between">
      <span className="text-sm">
        {nightCount > 0
          ? `${nightCount} ${nightCount === 1 ? 'night' : 'nights'} x ${
              pricePerNight !== undefined ? formatCurrency(pricePerNight) : '—'
            }`
          : 'Net price'}
      </span>
      <span className="text-base font-semibold">
        {nightCount > 0 && total !== undefined ? formatCurrency(total) : '—'}
      </span>
    </div>
    {nightCount > 0 && pets > 0 && (
      <div className="flex flex-row items-center justify-between">
        <span className="text-sm">
          {pets} {pets === 1 ? 'pet' : 'pets'} x {formatCurrency(PRICE_PET_PER_NIGHT)}
        </span>
        <span className="text-sm">{formatCurrency(petsCost)}</span>
      </div>
    )}
    {nightCount > 0 && (
      <div className="flex flex-row items-center justify-between">
        <span className="text-sm">Tax (10%)</span>
        <span className="text-sm">{tax !== undefined ? formatCurrency(tax) : '—'}</span>
      </div>
    )}
    {nightCount > 0 && (
      <div className="flex flex-row items-center justify-between">
        <span className="text-sm">City tax</span>
        <span className="text-sm">{formatCurrency(cityTax)}</span>
      </div>
    )}
    {nightCount > 0 && (
      <div className="flex flex-row items-center justify-between pt-1">
        <span className="text-sm">Gross total</span>
        <span className="text-base font-semibold">
          {grossTotal !== undefined ? formatCurrency(grossTotal) : '—'}
        </span>
      </div>
    )}
    {!(hasSelectedRoom && nightCount > 0) && (
      <div className="text-xs text-muted-foreground">
        {!hasSelectedRoom
          ? 'Assign a room to calculate the price.'
          : 'Select a date range to calculate the price.'}
      </div>
    )}
    {nightCount > 0 && pricePerNight === undefined && hasUnknownPrice && (
      <div className="text-xs text-destructive">
        {roomType
          ? `No base price set for ${roomType}. Set it on the Prices page, or enter a price per night above.`
          : 'No base price set for this room type. Set it on the Prices page, or enter a price per night above.'}
      </div>
    )}
  </div>
);
