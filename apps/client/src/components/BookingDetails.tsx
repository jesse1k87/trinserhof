import * as React from 'react';
import { Booking, CHANNELS, PRICE_PET_PER_NIGHT, RoomId, Status, STATUSES } from '@trinserhof/types';
import { BookingContext } from 'src/context/BookingContext';
import {
  bookingsAreDifferent,
  calculatePrice,
  formatCurrency,
  getYYYYmmDD,
} from '@trinserhof/helpers';
import { Button } from '@trinserhof/ui/src/components/shadcn/button';
import { Cross1Icon } from '@radix-ui/react-icons';
import { FormDatePicker } from '@trinserhof/ui/src/components/FormDatePicker';
import { ROOMS } from '@trinserhof/types';
import useCollection from 'src/hooks/useCollection';
import { Input } from '@trinserhof/ui/src/components/shadcn/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@trinserhof/ui/src/components/shadcn/select';
import { NumberPicker } from '@trinserhof/ui/src/components/NumberPicker';
import { Label } from '@trinserhof/ui/src/components/shadcn/label';
import { HorizontalLine } from '@trinserhof/ui/src/components/HorizontalLine';
import { DateRange } from 'react-day-picker';
import { saveBooking } from '@trinserhof/database';
import { User } from 'firebase/auth';
import { NoEditingAllowed } from '@trinserhof/ui';

const hasCustomPrice = (booking: Booking) => booking.priceFixed && booking.priceFixed !== '';

export const BookingDetails = ({ user, isAdmin }: { user: User | false; isAdmin: boolean }) => {
  const [booking, setBooking] = React.useContext(BookingContext);
  const [price, setPrice] = React.useState<number>(booking?.price ?? 0);

  const bookings = useCollection('bookings');

  const originalBooking = bookings?.find((b) => b?.id === booking?.id);

  const [hasChanges, setHasChanges] = React.useState<boolean>(!originalBooking);

  const checkForChanges = (booking: Booking) =>
    setHasChanges(
      Boolean(
        !originalBooking || (originalBooking && bookingsAreDifferent(originalBooking, booking)),
      ),
    );

  React.useEffect(() => {
    if (!booking) return;
    setPrice(calculatePrice(booking));
    checkForChanges(booking);
  }, [booking, bookings]);

  if (!booking) return null;

  const disabled = Boolean(!user || !isAdmin);

  return (
    <div className="absolute z-10 right-0 top-0 min-h-screen md:p-4">
      <div className="flex flex-col grid gap-4 p-6 pb-12 grid-cols-1 content-start flex-initial w-fulll md:min-w-96 md:max-w-96 border-t-4 border-t-[#173094] rounded-lg shadow-xl bg-white">
        {disabled && <NoEditingAllowed />}
        <div className="flex justify-between items-start">
          <div>
            <div className="text-sm text-gray-400">Booking details</div>
            <Input
              placeholder="Enter a name"
              value={booking.name}
              disabled={disabled}
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
          <div className="pt-1 text-xs text-gray-500">E-mail</div>
          <Input
            placeholder="E-mail"
            value={booking.email}
            disabled={disabled}
            border={true}
            onChange={(event) => setBooking({ ...booking, email: event.target.value })}
          />
        </div>

        <div className="flex flex-col w-full grid gap-1">
          <Input
            placeholder="Notes"
            value={booking.notes}
            disabled={disabled}
            onChange={(event) => setBooking({ ...booking, notes: event.target.value })}
            className="text-md p-0 border-0 focus-visible:ring-0 shadow-none"
          />
        </div>

        {typeof booking.message === 'string' && booking.message !== '' && (
          <div className="flex flex-col w-full grid gap-1">
            <div className="pt-1 text-xs text-gray-500">Message</div>
            <div className="pt-1">{booking.message}</div>
          </div>
        )}

        <Select
          defaultValue={booking.roomId}
          disabled={disabled}
          onValueChange={(newRoomId: RoomId) => {
            setBooking({ ...booking, roomId: newRoomId });
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
                  {label}
                  {!disabled &&
                    typeof pricePerNight === 'number' &&
                    ` (${formatCurrency(pricePerNight, 0)} pro Nacht)`}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex flex-col w-full grid gap-1 mb-2">
          <FormDatePicker
            initialFrom={new Date(booking.checkIn)}
            initialTo={new Date(booking.checkOut)}
            disabled={disabled}
            onChange={(dateRange: DateRange | undefined) => {
              setBooking({
                ...booking,
                ...(dateRange?.from && { checkIn: getYYYYmmDD(dateRange.from) }),
                ...(dateRange?.to && { checkOut: getYYYYmmDD(dateRange.to) }),
              });
            }}
          />
        </div>

        <NumberPicker
          label="Adults"
          sublabel="Age 16+"
          disabled={disabled}
          initialAmount={booking.adults}
          onChange={(newValue: number) => setBooking({ ...booking, adults: newValue })}
        />

        <NumberPicker
          label="Children"
          sublabel="Ages 2–15"
          disabled={disabled}
          initialAmount={booking.children}
          onChange={(newValue: number) => setBooking({ ...booking, children: newValue })}
        />

        <NumberPicker
          label="Baby/toddler"
          sublabel="Free up to age 2"
          disabled={disabled}
          initialAmount={booking.babies}
          onChange={(newValue: number) => setBooking({ ...booking, babies: newValue })}
        />

        <NumberPicker
          label="Pets"
          sublabel={`${formatCurrency(PRICE_PET_PER_NIGHT)} p.p.p.n.`}
          disabled={disabled}
          initialAmount={booking.pets}
          onChange={(newValue: number) => setBooking({ ...booking, pets: newValue })}
        />

        {user && (
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
                  ? isNaN(Number(booking.priceFixed))
                    ? booking.priceFixed
                    : formatCurrency(Number(booking.priceFixed))
                  : isNaN(price)
                    ? price
                    : formatCurrency(price)}
              </div>
              <div className="flex justify-end text-xs">excl. VAT</div>
            </div>
          </div>
        )}

        <HorizontalLine />

        {user && !disabled && (
          <div className="flex flex-col w-full grid gap-1">
            <div className="pt-1 text-xs text-gray-500">Custom price</div>
            <Input
              placeholder="&euro; ..."
              type="text"
              value={booking.priceFixed}
              disabled={disabled}
              onChange={(event) => setBooking({ ...booking, priceFixed: event.target.value })}
              className="flex w-full text-right"
            />
          </div>
        )}

        <div className="flex flex-col w-full grid gap-1">
          <div className="pt-1 text-xs text-gray-500">Status</div>
          <Select
            defaultValue={booking.status}
            disabled={disabled}
            onValueChange={(newValue: Status) => setBooking({ ...booking, status: newValue })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  <div className={`status-${status} flex flex-row items-center`}>
                    <div className="status-icon h-4 w-4 rounded-full mr-2"></div>
                    <div>{status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col w-full grid gap-1">
          <div className="pt-1 text-xs text-gray-500">Channel</div>
          <Select
            defaultValue={booking.channel}
            disabled={disabled}
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
          </Select>
        </div>

        <div className="flex flex-col w-full grid gap-1">
          <div className="pt-1 text-xs text-gray-500">Phone</div>
          <Input
            placeholder="Phone"
            value={booking.phone}
            disabled={disabled}
            border={true}
            onChange={(event) => setBooking({ ...booking, phone: event.target.value })}
          />
        </div>

        {isAdmin && (
          <div className="flex flex-row justify-between w-full">
            <div>
              {booking.deleted ? (
                <Button
                  variant="outline"
                  className="mr-2"
                  onClick={async () => {
                    setBooking((await saveBooking({ ...booking, deleted: false })) ?? null);
                  }}
                >
                  Restore
                </Button>
              ) : (
                <Button
                  variant="destructive"
                  className="mr-2"
                  onClick={async () => {
                    setBooking((await saveBooking({ ...booking, deleted: true })) ?? null);
                  }}
                >
                  Delete
                </Button>
              )}
            </div>
            {hasChanges && (
              <div className="flex flex-row justify-end">
                <Button
                  variant="outline"
                  className="mr-2"
                  onClick={() => setBooking(originalBooking ?? null)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={async () => setBooking((await saveBooking(booking)) ?? null)}
                >
                  Save
                </Button>
              </div>
            )}
          </div>
        )}

        {user && (
          <div className="flex flex-row justify-center items-center content-center text-xs text-gray-400 mt-4 grid gap-2">
            <div className="text-center">{booking.id}</div>
            {typeof booking.content === 'string' && booking.content !== '' && (
              <div className="text-center">{booking.content}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
