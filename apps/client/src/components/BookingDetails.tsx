import * as React from 'react';
import { FormAdultPicker } from './FormAdultPicker';
import { FormChildPicker } from './FormChildPicker';
import { FormEmail } from './FormEmail';
import { FormPetPicker } from './FormPetPicker';
import { FormPrice } from './FormPrice';
import { formWrapperClasses } from 'src/constants';
import { FormDatePicker } from './FormDatePicker';
import { FormName } from './FormName';
import { HorizontalLine } from './HorizontalLine';
import { Cross1Icon } from '@radix-ui/react-icons';
import { FormButtons } from './FormButtons';

export const BookingDetails = ({
  setDetailsOpen,
}: {
  setDetailsOpen: (value: boolean) => void;
}) => {
  const [disabled, setDisabled] = React.useState(true);

  return (
    <div
      className={`${formWrapperClasses} border border-gray-200 rounded-lg shadow-xl absolute right-8 top-8 bg-white`}
    >
      <div className="flex justify-between">
        <div className="font-bold">Booking details</div>
        <div className="font-bold">
          <Cross1Icon onClick={() => setDetailsOpen(false)} className="hover:cursor-pointer" />
        </div>
      </div>

      <div className="flex flex-col grid gap-4 p-0">
        <FormName />
        <FormEmail />
      </div>

      <HorizontalLine />

      <FormDatePicker />
      <FormAdultPicker />
      <FormChildPicker />
      <FormPetPicker />
      <FormPrice />

      <FormButtons />
    </div>
  );
};
