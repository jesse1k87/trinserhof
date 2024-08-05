import * as React from 'react';
import { Booking, petPricePerNight } from '@bookings/types';
import { BookingContext } from 'src/context/BookingContext';
import { bookingsAreDifferent, formatCurrency } from '@bookings/helpers';
import { Button } from '@/components/ui/button';
import { Cross1Icon } from '@radix-ui/react-icons';
// import { debounce } from 'lodash';
import { Error } from './Error';
import { FormDatePicker } from './FormDatePicker';
import { FormPrice } from './FormPrice';
import { formWrapperClasses } from 'src/constants';
import { HorizontalLine } from './HorizontalLine';
import { Input } from '@/components/ui/input';
import { NumberPicker } from './NumberPicker';
import { pushBooking } from 'src/helpers/pushBooking';

export const BookingDetails = ({ originalBooking }: { originalBooking: Booking | undefined }) => {
  const [booking, setBooking] = React.useContext(BookingContext);

  const [errors, setErrors] = React.useState<[]>([]);
  const [hasChanges, setHasChanges] = React.useState<boolean>(false);

  // const updateBooking = React.useCallback(
  //   debounce((booking) => {
  //     setBooking(booking);
  //   }, 400),
  //   [setBooking],
  // );

  const checkForChanges = () =>
    setHasChanges(originalBooking ? bookingsAreDifferent(originalBooking, booking) : true);

  React.useEffect(() => {
    checkForChanges();
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

      <div className="flex flex-col w-full grid gap-1 mb-2">
        <div className="pt-1 text-xs text-gray-500">Dates</div>
        <FormDatePicker onChange={(newBooking: Booking) => setBooking(newBooking)} />
      </div>

      {/* <Status /> */}
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

      <HorizontalLine />

      <div className="flex flex-col w-full grid gap-1">
        <div className="pt-1 text-xs text-gray-500">Final price</div>
        <Input
          placeholder="&euro; ..."
          type="number"
          value={booking.priceFixed}
          onChange={(event) => setBooking({ ...booking, priceFixed: event.target.value })}
          className="flex w-full text-right"
        />
      </div>

      <div className="flex flex-col w-full grid gap-1">
        <div className="pt-1 text-xs text-gray-500">E-mail</div>
        <Input
          placeholder="E-mail"
          value={booking.email}
          onChange={(event) => setBooking({ ...booking, email: event.target.value })}
        />
      </div>

      <div className="flex flex-col w-full grid gap-1">
        <div className="pt-1 text-xs text-gray-500">Notes</div>
        <Input
          placeholder="Notes"
          value={booking.notes}
          onChange={(event) => setBooking({ ...booking, notes: event.target.value })}
        />
      </div>

      {hasChanges && (
        <div className="flex flex-row justify-end">
          <Button
            variant="outline"
            className="mr-2"
            onClick={async () => {
              setBooking(originalBooking);
              checkForChanges();
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={async () => {
              await pushBooking(booking);
              checkForChanges();
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
