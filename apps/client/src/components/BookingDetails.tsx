import * as React from 'react';
import { Booking, petPricePerNight } from '@bookings/types';
import { BookingContext } from 'src/context/BookingContext';
import { bookingsAreDifferent, calculatePrice, formatCurrency } from '@bookings/helpers';
import { Button } from '@/components/ui/button';
import { Cross1Icon } from '@radix-ui/react-icons';
import { Error } from './Error';
import { FormDatePicker } from './FormDatePicker';
import { formWrapperClasses } from 'src/constants';
import { HorizontalLine } from './HorizontalLine';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NumberPicker } from './NumberPicker';
import { pushBooking } from 'src/helpers/pushBooking';
import { ROOMS } from '@bookings/types';
import {
  Select as ShadCnSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export const BookingDetails = ({ originalBooking }: { originalBooking: Booking | undefined }) => {
  const [booking, setBooking] = React.useContext(BookingContext);
  const [price, setPrice] = React.useState<number>(booking.price);
  const [errors, setErrors] = React.useState<[]>([]);
  const [hasChanges, setHasChanges] = React.useState<boolean>(false);

  const checkForChanges = () =>
    setHasChanges(originalBooking ? bookingsAreDifferent(originalBooking, booking) : true);

  React.useEffect(() => {
    setPrice(booking.price);
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

      <ShadCnSelect
        defaultValue={booking.roomId}
        onValueChange={(newRoomId) => {
          const newBooking = { ...booking, roomId: newRoomId };
          const price = calculatePrice(newBooking);
          setPrice(price);
          setBooking({ ...newBooking, price });
        }}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {ROOMS.map(({ id, label }) => (
            <SelectItem key={id} value={id}>
              Room {id}
              <div className="text-xs text-gray-400">{label}</div>
            </SelectItem>
          ))}
        </SelectContent>
      </ShadCnSelect>

      <NumberPicker
        label="Adults"
        sublabel="Age 16+"
        initialAmount={booking.adults}
        onChange={(newValue: number) => {
          const newBooking = { ...booking, adults: newValue };
          const price = calculatePrice(newBooking);
          setPrice(price);
          setBooking({ ...newBooking, price });
        }}
      />

      <NumberPicker
        label="Children"
        sublabel="Ages 2–15"
        initialAmount={booking.children}
        onChange={(newValue: number) => setBooking({ ...booking, children: newValue })}
      />

      <NumberPicker
        label="Baby/toddler"
        sublabel="< 2 (free)"
        initialAmount={booking.babies}
        onChange={(newValue: number) => setBooking({ ...booking, babies: newValue })}
      />

      <NumberPicker
        label="Pets"
        sublabel={`${formatCurrency(petPricePerNight)} p.p.p.n.`}
        initialAmount={booking.pets}
        onChange={(newValue: number) => setBooking({ ...booking, pets: newValue })}
      />

      <div className="grid items-center justify-items-end gap-4 grid-cols-2">
        <div className="flex w-full">
          <Label className="font-semibold">Total price</Label>
        </div>
        <div className="flex flex-col text-right">
          {typeof booking.priceFixed === 'string' && booking.priceFixed !== '' && (
            <s className="text-lg">{formatCurrency(price)}</s>
          )}
          <div className="flex justify-end text-lg font-semibold">
            {formatCurrency(
              typeof booking.priceFixed === 'string' && booking.priceFixed
                ? booking.priceFixed
                : price,
            )}
          </div>
          <div className="flex justify-end text-xs">excl. VAT </div>
        </div>
      </div>

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

      <div className="flex justify-center text-xs text-gray-300 mt-2">ID: {booking.id}</div>
    </div>
  );
};
