import * as React from 'react';
import { BookingContext } from 'src/context/BookingContext';
import { Cross1Icon } from '@radix-ui/react-icons';
import { FormDatePicker } from './FormDatePicker';
import { formWrapperClasses } from 'src/constants';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NumberPicker } from './NumberPicker';
import { Booking, petPricePerNight } from '@bookings/types';
import { bookingsAreDifferent, formatCurrency } from '@bookings/helpers';
import { FormPrice } from './FormPrice';
import { Error } from './Error';
import { pushBooking } from 'src/helpers/pushBooking';
import { debounce } from 'lodash';
import { Button } from '@/components/ui/button';

export const BookingDetails = ({ originalBooking }: { originalBooking: Booking }) => {
  const [booking, setBooking] = React.useContext(BookingContext);

  const [errors, setErrors] = React.useState<[]>([]);
  const [hasChanges, setHasChanges] = React.useState<boolean>(false);

  const updateBooking = React.useCallback(
    debounce((booking) => {
      setBooking(booking);
    }, 400),
    [setBooking],
  );

  React.useEffect(() => {
    setHasChanges(bookingsAreDifferent(originalBooking, booking));
    // updateBooking(booking); // Auto-save?
  }, [booking]);

  return (
    <div
      className={`${formWrapperClasses} border border-gray-200 rounded-lg shadow-xl absolute top-4 bg-white md:right-4`}
    >
      <div className="flex justify-between items-start">
        <div>
          <div className="text-sm text-gray-400">Booking details</div>
          <Input
            placeholder="Enter a name"
            value={booking.name}
            onChange={(event) => setBooking({ ...booking, name: event.target.value })}
            className="flex w-full text-2xl font-bold p-0 border-0 focus-visible:ring-0 shadow-none"
          />
        </div>
        <div
          className="p-3 rounded-full hover:bg-accent hover:cursor-pointer text-gray-500"
          onClick={() => setBooking(null)}
        >
          <Cross1Icon />
        </div>
      </div>

      <div className="flex flex-col w-full grid gap-1">
        <Input
          placeholder="E-mail"
          value={booking.email}
          onChange={(event) => setBooking({ ...booking, email: event.target.value })}
        />
      </div>

      <FormDatePicker onChange={(newBooking: Booking) => setBooking(newBooking)} />

      {/* <Status /> */}
      {/* <HorizontalLine /> */}
      {/* <RoomPicker /> */}

      <NumberPicker
        label="Amount of adults"
        sublabel="Age 16+"
        initialAmount={booking.adults}
        onChange={(newValue: number) => setBooking({ ...booking, adults: newValue })}
      />

      <NumberPicker
        label="Amount of children"
        sublabel="Ages 2–15"
        initialAmount={booking.children}
        onChange={(newValue: number) => setBooking({ ...booking, children: newValue })}
      />

      <NumberPicker
        label="Amount of pets"
        sublabel={`${formatCurrency(petPricePerNight)} p.p.p.n.`}
        initialAmount={booking.pets}
        onChange={(newValue: number) => setBooking({ ...booking, pets: newValue })}
      />

      <FormPrice />

      <div className="grid items-center justify-items-end gap-4 grid-cols-2">
        <div className="flex w-full">
          <Label className="font-semibold">Fixed price</Label>
        </div>
        <div className="flex flex-col w-full grid gap-1">
          <Input
            type="number"
            className="flex w-full text-right"
            placeholder="Fixed price"
            onChange={(event) => setBooking({ ...booking, priceFixed: event.target.value })}
          />
        </div>
      </div>

      {hasChanges && (
        <div className="flex flex-row justify-end">
          <Button
            onClick={async () => {
              await pushBooking(booking);
              setHasChanges(bookingsAreDifferent(originalBooking, booking));
            }}
          >
            Save
          </Button>
        </div>
      )}

      {errors.length > 0 && (
        <div>
          {errors.map((error, index) => (
            <Error key={`error_${index}`} message={`${error.path[0]}: ${error.message}`} />
          ))}
        </div>
      )}
    </div>
  );
};
