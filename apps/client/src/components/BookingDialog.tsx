import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FormAdultPicker } from './FormAdultPicker';
import { FormChildPicker } from './FormChildPicker';
import { FormPetPicker } from './FormPetPicker';
import { FormPrice } from './FormPrice';
import useBookingForm from '../hooks/useBookingForm';
import { addDays } from 'date-fns';
import useSelectedBooking from 'src/hooks/useSelectedBooking';

export const BookingDialog = () => {
  const { selectedBooking, setSelectedBookingId } = useSelectedBooking();

  const defaultNights = 2;
  const initialCheckIn = new Date();
  const initialCheckOut = addDays(new Date(), defaultNights);

  const { adults, setAdults, children, pets, setPets, price } = useBookingForm({
    defaultNights,
    initialCheckIn,
    initialCheckOut,
  });

  return (
    <Dialog open={Boolean(selectedBooking)}>
      <DialogContent
        onEscapeKeyDown={() => setSelectedBookingId(undefined)}
        className="sm:max-w-[425px]"
      >
        <DialogHeader>
          <DialogTitle>Edit booking</DialogTitle>
          {/* <DialogDescription>
            Make changes to your profile here. Click save when you're done.
          </DialogDescription> */}
        </DialogHeader>
        <FormAdultPicker amount={adults} set={setAdults} />
        <FormChildPicker amount={children} set={setAdults} />
        <FormPetPicker amount={pets} set={setPets} />
        <FormPrice price={price} />
      </DialogContent>
    </Dialog>
  );
};
