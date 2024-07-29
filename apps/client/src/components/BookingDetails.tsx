import * as React from 'react';
import { FormAdultPicker } from './FormAdultPicker';
import { FormChildPicker } from './FormChildPicker';
import { FormPetPicker } from './FormPetPicker';
import { FormPrice } from './FormPrice';
import { formWrapperClasses } from 'src/constants';
import { Booking } from '@bookings/types';

export const BookingDetails = ({ booking }: { booking: Booking }) => {
  return (
    <div className={`${formWrapperClasses} border border-gray-200`}>
      <FormAdultPicker amount={booking.adults} set={() => {}} />
      <FormChildPicker amount={booking.children} set={() => {}} />
      <FormPetPicker amount={booking.pets} set={() => {}} />
      <FormPrice price={booking.price} />
    </div>
  );
};
