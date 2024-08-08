import * as React from 'react';
import {
  Select as ShadCnSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Booking, CHANNELS, petPricePerNight } from '@bookings/types';
import { BookingContext } from 'src/context/BookingContext';
import { bookingsAreDifferent, calculatePrice, formatCurrency } from '@bookings/helpers';
import { Button } from '@/components/ui/button';
import { Cross1Icon } from '@radix-ui/react-icons';
import { Error } from './Error';
import { FormDatePicker } from './FormDatePicker';
import { HorizontalLine } from './HorizontalLine';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NumberPicker } from './NumberPicker';
import { ROOMS } from '@bookings/types';
import { saveBooking } from 'src/firebase';
import useCollection from 'src/hooks/useCollection';

const hasCustomPrice = (booking: Booking) => booking.priceFixed && booking.priceFixed !== '';

export const BookingDetails = ({ isAdmin }: { isAdmin: boolean }) => {
  const [booking, setBooking] = React.useContext(BookingContext);
  const [price, setPrice] = React.useState<number>(booking.price);
  const [errors, setErrors] = React.useState<[]>([]);
  const [hasChanges, setHasChanges] = React.useState<boolean>(false);

  const bookings = useCollection('bookings');

  const originalBooking = bookings?.find((b) => b?.id === booking?.id);

  const checkForChanges = () =>
    setHasChanges(originalBooking ? bookingsAreDifferent(originalBooking, booking) : true);

  React.useEffect(() => {
    setPrice(booking.price);
    checkForChanges();
  }, [booking]);

  return (
    <div className="absolute z-10 right-0 top-0 min-h-screen md:p-4">
      <div className="flex flex-col grid gap-4 p-6 pb-12 grid-cols-1 content-start flex-initial w-fulll md:min-w-96 md:max-w-96 border-t-4 border-t-orange-500 rounded-lg shadow-xl bg-white">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-sm text-gray-400">Booking details</div>
            <Input
              placeholder="Enter a name"
              value={booking.name}
              disabled={!isAdmin}
              onChange={(event) => setBooking({ ...booking, name: event.target.value })}
              className="flex w-full text-2xl font-bold p-0 border-0 focus-visible:ring-0 shadow-none"
            />
          </div>
          <div
            className="p-3 rounded-full hover:bg-accent hover:cursor-pointer text-gray-800"
            onClick={() => setBooking(null)}
          >
            <Cross1Icon />
          </div>
        </div>

        <div className="flex flex-col w-full grid gap-1">
          <Input
            placeholder="Notes"
            value={booking.notes}
            disabled={!isAdmin}
            onChange={(event) => setBooking({ ...booking, notes: event.target.value })}
            className="text-md p-0 border-0 focus-visible:ring-0 shadow-none"
          />
        </div>

        <ShadCnSelect
          defaultValue={booking.roomId}
          disabled={!isAdmin}
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
            {ROOMS.map(({ id, label, pricePerNight }) => (
              <SelectItem key={id} value={id}>
                Room {id}
                <div className="text-xs text-gray-400">
                  {label}{' '}
                  {typeof pricePerNight === 'number' &&
                    `(${formatCurrency(pricePerNight, 0)} pro Nacht)`}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </ShadCnSelect>

        <div className="flex flex-col w-full grid gap-1 mb-2">
          <FormDatePicker
            disabled={!isAdmin}
            onChange={(newBooking: Booking) => setBooking(newBooking)}
          />
        </div>

        <NumberPicker
          label="Adults"
          sublabel="Age 16+"
          disabled={!isAdmin}
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
          disabled={!isAdmin}
          initialAmount={booking.children}
          onChange={(newValue: number) => {
            const newBooking = { ...booking, children: newValue };
            const price = calculatePrice(newBooking);
            setPrice(price);
            setBooking({ ...newBooking, price });
          }}
        />

        <NumberPicker
          label="Baby/toddler"
          sublabel="< 2 (free)"
          disabled={!isAdmin}
          initialAmount={booking.babies}
          onChange={(newValue: number) => setBooking({ ...booking, babies: newValue })}
        />

        <NumberPicker
          label="Pets"
          sublabel={`${formatCurrency(petPricePerNight)} p.p.p.n.`}
          disabled={!isAdmin}
          initialAmount={booking.pets}
          onChange={(newValue: number) => {
            const newBooking = { ...booking, pets: newValue };
            const price = calculatePrice(newBooking);
            setPrice(price);
            setBooking({ ...newBooking, price });
          }}
        />

        {isAdmin && (
          <div className="grid items-center justify-items-end gap-4 grid-cols-2">
            <div className="flex w-full">
              <Label className="font-semibold">Total price</Label>
            </div>
            <div className="flex flex-col text-right">
              {hasCustomPrice(booking) && (
                <s className="text-lg">{isNaN(price) ? price : formatCurrency(price)}</s>
              )}
              <div className="flex justify-end text-lg font-semibold">
                {hasCustomPrice(booking)
                  ? isNaN(booking.priceFixed)
                    ? booking.priceFixed
                    : formatCurrency(booking.priceFixed)
                  : isNaN(price)
                    ? price
                    : formatCurrency(price)}
              </div>
              <div className="flex justify-end text-xs">excl. VAT</div>
            </div>
          </div>
        )}

        <HorizontalLine />

        {isAdmin && (
          <div className="flex flex-col w-full grid gap-1">
            <div className="pt-1 text-xs text-gray-500">Custom price</div>
            <Input
              placeholder="&euro; ..."
              type="text"
              value={booking.priceFixed}
              disabled={!isAdmin}
              onChange={(event) => setBooking({ ...booking, priceFixed: event.target.value })}
              className="flex w-full text-right"
            />
          </div>
        )}

        <div className="flex flex-col w-full grid gap-1">
          <div className="pt-1 text-xs text-gray-500">E-mail</div>
          <Input
            placeholder="E-mail"
            value={booking.email}
            disabled={!isAdmin}
            onChange={(event) => setBooking({ ...booking, email: event.target.value })}
          />
        </div>

        <div className="flex flex-col w-full grid gap-1">
          <div className="pt-1 text-xs text-gray-500">Channel</div>
          <ShadCnSelect
            defaultValue={booking.channel}
            disabled={!isAdmin}
            onValueChange={(newChannel) => setBooking({ ...booking, channel: newChannel })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CHANNELS.map(({ id, label }) => (
                <SelectItem key={id} value={id}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </ShadCnSelect>
        </div>

        {isAdmin && hasChanges && (
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
                await saveBooking(booking);
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

        {isAdmin && (
          <div className="flex justify-center text-xs text-gray-300 mt-2">ID: {booking.id}</div>
        )}
      </div>
    </div>
  );
};
