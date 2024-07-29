import * as React from 'react';
import { BookingContext } from 'src/context/BookingContext';
import { FormAdultPicker } from './FormAdultPicker';
import { FormButtons } from './FormButtons';
import { FormChildPicker } from './FormChildPicker';
import { FormDatePicker } from './FormDatePicker';
import { FormEmail } from './FormEmail';
import { FormName } from './FormName';
import { FormNotes } from './FormNotes';
import { FormPetPicker } from './FormPetPicker';
import { FormPrice } from './FormPrice';
import { formWrapperClasses } from 'src/constants';
import { HorizontalLine } from './HorizontalLine';
import { RoomPicker } from './RoomPicker';
import { Status } from './Status';

export const BookingDetails = () => {
  const [disabled, setDisabled] = React.useState(true);

  const [booking, setBooking] = React.useContext(BookingContext);
  if (!booking) return null;

  return (
    <div
      className={`${formWrapperClasses} border border-gray-200 rounded-lg shadow-xl absolute right-8 top-8 bg-white`}
    >
      <div>
        <div className="text-sm text-gray-400">Booking details</div>
        <FormName />
      </div>

      {/* <Status /> */}
      <div className="flex flex-col grid gap-3">
        <FormEmail />
        <FormNotes />
      </div>

      {/* <HorizontalLine /> */}

      <RoomPicker />
      <FormDatePicker />
      <FormAdultPicker />
      <FormChildPicker />
      <FormPetPicker />
      <FormPrice />

      <FormButtons />
    </div>
  );
};
