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
import { RoomPicker } from './RoomPicker';
import { Cross1Icon } from '@radix-ui/react-icons';

export const BookingDetails = () => {
  const [booking, setBooking] = React.useContext(BookingContext);
  if (!booking) return null;

  return (
    <div
      className={`${formWrapperClasses} border border-gray-200 rounded-lg shadow-xl absolute top-4 bg-white md:right-4`}
    >
      <div className="flex justify-between items-start">
        <div>
          <div className="text-sm text-gray-400">Booking details</div>
          <FormName />
        </div>
        <div
          className="p-3 rounded-full hover:bg-accent hover:cursor-pointer text-gray-500"
          onClick={() => setBooking(null)}
        >
          <Cross1Icon />
        </div>
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
