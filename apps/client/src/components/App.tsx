import * as React from 'react';
import '../index.css';
import { GutZuWissen } from './GutZuWissen';
import { DateRangePicker } from './DateRangePicker';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { NumberPicker } from './NumberPicker';
import { addDays } from 'date-fns';
import { Select } from './Select';
import { Textarea } from '@/components/ui/textarea';
import { submit } from 'src/submit';
import { ROOMS, type RoomType, petPricePerNight } from '@bookings/types';
import {
  getPrice,
  getAmountOfNightsFromDateRange,
  dateToString,
  formatCurrency,
  isValidEmailAddress,
} from '@bookings/helpers';

export const App = () => {
  const [success, setSuccess] = React.useState<boolean>(false);

  const [error, setError] = React.useState<string | false>(false);
  const [emailInvalid, setEmailInvalid] = React.useState<boolean>(false);

  const [loading, setLoading] = React.useState<boolean>(false);

  const [price, setPrice] = React.useState<number>(0);

  const defaultNights = 2;

  const initialCheckIn = new Date();
  const initialCheckOut = addDays(new Date(), defaultNights);

  const [email, setEmail] = React.useState<string>('');
  const [roomType, setRoomType] = React.useState<RoomType>('SUITE');
  const [nights, setNights] = React.useState<number>(defaultNights);
  const [checkIn, setCheckIn] = React.useState<Date>(initialCheckIn);
  const [checkOut, setCheckOut] = React.useState<Date>(initialCheckOut);
  const [adults, setAdults] = React.useState<number>(1);
  const [children, setChildren] = React.useState<number>(0);
  const [pets, setPets] = React.useState<number>(0);

  React.useEffect(() => {
    setNights(getAmountOfNightsFromDateRange({ from: checkIn, to: checkOut }));
    setPrice(
      getPrice({
        nights,
        roomType,
        adults,
        children,
        pets,
      }),
    );
  }, [roomType, nights, adults, children, pets]);

  return (
    <div className="flex flex-row py-12 px-4 min-h-screen justify-center justify-items-center items-center">
      <div className="grid gap-8 grid-cols-1 w-full w-max min-w-80 max-w-80">
        <div className="flex flex-col justify-center items-center mb-4">
          <img src="./hotel-trinserhof.png" className="w-40" />
        </div>

        {success ? (
          <>
            We successfully received your request and we have sent a summary of your request to{' '}
            <span className="font-semibold">{email}</span>.<br />
            <br />
            We will inform you about our availability soon and let you know if your reservation is
            confirmed.
            <br />
            <br />
            The Covi's
          </>
        ) : (
          <>
            <Select
              selected={roomType}
              onChange={(value) => setRoomType(value)}
              options={ROOMS.map(({ type, label, description }) => {
                return { value: type, label, description };
              })}
            />

            <div className="flex w-full items-center">
              <DateRangePicker
                from={initialCheckIn}
                to={initialCheckOut}
                onChange={(dateRange) => {
                  if (dateRange?.from) setCheckIn(dateRange.from);
                  if (dateRange?.to) setCheckOut(dateRange.to);
                  setNights(
                    getAmountOfNightsFromDateRange({ from: dateRange?.from, to: dateRange?.to }),
                  );
                }}
              />
              <div className="ml-2 text-xs text-gray-500">
                {nights} {nights === 1 ? 'night' : 'nights'}
              </div>
            </div>

            <NumberPicker
              label="Amount of adults"
              sublabel="Age 16+"
              initialAmount={adults}
              onChange={(newValue) => setAdults(newValue)}
            />
            <NumberPicker
              label="Amount of children"
              sublabel="Ages 2–15"
              initialAmount={children}
              onChange={(newValue) => setChildren(newValue)}
            />
            <NumberPicker
              label="Amount of pets"
              sublabel={`${formatCurrency(petPricePerNight)} p.p.p.n.`}
              initialAmount={pets}
              maxAmount={3}
              onChange={(newValue) => setPets(newValue)}
            />

            <div className="grid items-center justify-items-end gap-4 grid-cols-2">
              <div className="flex w-full">
                <Label className="font-semibold">Total price</Label>
              </div>
              <div
                className={`flex flex-col font-semibold text-lg ${price === 0 && 'text-gray-400'}`}
              >
                {formatCurrency(price)}
                <div className="flex justify-end text-xs">excl. VAT </div>
              </div>
            </div>

            <div className="grid gap-2">
              <Input
                id="email"
                type="email"
                className={`flex w-full ${emailInvalid && 'border-2 border-red-500 text-red-500'}`}
                value={email} // Remove later
                placeholder="your@email.com"
                onChange={(event) => {
                  setEmailInvalid(false);
                  setEmail(event.target.value);
                }}
                required
              />
              {emailInvalid && (
                <div className="text-xs text-red-500 mb-2">
                  Please enter a valid e-mail, so we can contact you.
                </div>
              )}
              <Textarea placeholder="Your message (optional)" id="message" className="w-full" />
            </div>

            <div className="flex flex-col justify-end gap-2">
              <Button
                disabled={loading}
                className=""
                onClick={() => {
                  if (!isValidEmailAddress(email)) {
                    setEmailInvalid(true);
                    return;
                  }

                  setLoading(true);

                  submit({
                    booking: {
                      email,
                      checkIn: dateToString(checkIn),
                      checkOut: dateToString(checkOut),
                      roomType,
                      adults,
                      children,
                      pets,
                    },
                    afterSuccess: () => {
                      setLoading(false);
                    },
                    afterError: (error) => {
                      setError(error);
                      setLoading(false);
                    },
                  });
                }}
              >
                Request availability
              </Button>
            </div>
          </>
        )}

        <GutZuWissen />

        <div className="flex flex-col justify-center items-center mt-6">
          <div className="text-xs font-semibold mt-2">Hotel Trinserhof GmbH</div>
          <div className="text-xs text-gray-500">Trins 106, 6152 Trins, Austria</div>
          <div className="text-xs text-gray-500">hotel@trinserhof.com</div>
          <div className="text-xs text-gray-500">+43 676 4002982</div>
        </div>
      </div>
    </div>
  );
};
