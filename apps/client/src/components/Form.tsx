import * as React from 'react';
import '../index.css';
import { DateRangePicker } from './DateRangePicker';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select } from './Select';
import { Textarea } from '@/components/ui/textarea';
import { submit } from 'src/submit';
import { Booking, ROOM_TYPES } from '@bookings/types';
import { dateToString, isValidEmailAddress } from '@bookings/helpers';
import { FormPrice } from './FormPrice';
import { FormAdultPicker } from './FormAdultPicker';
import { FormChildPicker } from './FormChildPicker';
import { FormPetPicker } from './FormPetPicker';
import useSelectedBooking from 'src/hooks/useSelectedBooking';

import { formWrapperClasses } from 'src/constants';

export const Form = ({ initialMessage = '' }: { initialMessage: Booking['message'] }) => {
  const [success, setSuccess] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | false>(false);
  const [emailInvalid, setEmailInvalid] = React.useState<boolean>(false);
  const [loading, setLoading] = React.useState<boolean>(false);

  const [email, setEmail] = React.useState<string>('your@email.com');
  const [message, setMessage] = React.useState<string>(initialMessage);

  const { booking, setBooking } = useSelectedBooking();

  return (
    <div className={`${formWrapperClasses}`}>
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
            options={ROOM_TYPES.map(({ type, label, description }) => {
              return { value: type, label, description };
            })}
          />

          <FormDatePicker />

          <FormAdultPicker amount={adults} set={setAdults} />
          <FormChildPicker amount={children} set={setChildren} />
          <FormPetPicker amount={pets} set={setPets} />
          <FormPrice price={price} />

          <div className="grid gap-2">
            <Input
              id="email"
              type="email"
              className={`flex w-full ${emailInvalid && 'border-2 border-red-500 text-red-500'}`}
              value={email}
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
            <Textarea
              placeholder="Your message (optional)"
              id="message"
              className="w-full"
              onChange={(event) => setMessage(event.target.value)}
            >
              {message}
            </Textarea>
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
                    message,
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
            {error && <div className="text-xs text-red-500 mb-2">{error}</div>}
          </div>
        </>
      )}
    </div>
  );
};
