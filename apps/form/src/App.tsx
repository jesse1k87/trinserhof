import './index.css';
import * as React from 'react';
import {
  formatCurrency,
  getNewBooking,
  getYYYYmmDD,
  isValidEmailAddress,
} from '@trinserhof/helpers';
import { Booking, PRICE_PET_PER_NIGHT } from '@trinserhof/types';
import { Button, FormDatePicker, Input, NumberPicker, Textarea } from '@trinserhof/ui';
import { DateRange } from 'react-day-picker';
import { saveBooking } from '@trinserhof/database';
import { sendEmail } from './email';

export const App = () => {
  const initialErrors = { name: '', email: '', generic: '' };
  const [errors, setErrors] =
    React.useState<Record<'name' | 'email' | 'generic', string>>(initialErrors);
  const [success, setSuccess] = React.useState<string>('');

  const [booking, setBooking] = React.useState<Booking>(getNewBooking());
  const [submitting, setSubmitting] = React.useState<boolean>(false);

  return (
    <div className="flex flex-col w-full content-center items-center">
      <div className="flex flex-col grid gap-4 p-6 grid-cols-1 content-start min-w-[280px] max-w-[280px]">
        {/* <div className="flex flex-row justify-center">
          <img src="hotel-trinserhof.png" className="my-4 max-h-[100px]" />
        </div> */}
        <div className="flex flex-col w-full grid gap-1 mb-2">
          <FormDatePicker
            initialFrom={new Date(booking.checkIn)}
            initialTo={new Date(booking.checkOut)}
            disabled={submitting}
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
          disabled={submitting}
          initialAmount={booking.adults}
          onChange={(newValue: number) => setBooking({ ...booking, adults: newValue })}
        />

        <NumberPicker
          label="Children"
          sublabel="Ages 2–15"
          disabled={submitting}
          initialAmount={booking.children}
          onChange={(newValue: number) => setBooking({ ...booking, children: newValue })}
        />

        <NumberPicker
          label="Baby/toddler"
          sublabel="Free up to age 2"
          disabled={submitting}
          initialAmount={booking.babies}
          onChange={(newValue: number) => setBooking({ ...booking, babies: newValue })}
        />

        <NumberPicker
          label="Pets"
          sublabel={`${formatCurrency(PRICE_PET_PER_NIGHT)} p.p.p.n.`}
          disabled={submitting}
          initialAmount={booking.pets}
          onChange={(newValue: number) => setBooking({ ...booking, pets: newValue })}
        />

        <div className="flex flex-col w-full grid gap-1">
          <div className="pt-1 text-xs text-gray-500">Name</div>
          <Input
            placeholder="Name"
            value={booking.name}
            disabled={submitting}
            className="bg-white"
            onChange={(event) => {
              setErrors({ ...errors, name: '' });
              setBooking({ ...booking, name: event.target.value });
            }}
          />
          {errors.name !== '' && (
            <p className="text-[0.8rem] font-medium text-destructive">{errors.name}</p>
          )}
        </div>

        <div className="flex flex-col w-full grid gap-1">
          <div className="pt-1 text-xs text-gray-500">E-mail</div>
          <Input
            placeholder="E-mail"
            value={booking.email}
            disabled={submitting}
            className="bg-white"
            onChange={(event) => {
              setErrors({ ...errors, email: '' });
              setBooking({ ...booking, email: event.target.value });
            }}
          />
          {errors.email !== '' && (
            <p className="text-[0.8rem] font-medium text-destructive">{errors.email}</p>
          )}
        </div>

        <div className="flex flex-col w-full grid gap-1">
          <div className="pt-1 text-xs text-gray-500">Message (optional)</div>
          <Textarea
            placeholder="Message"
            className="bg-white w-full"
            disabled={submitting}
            value={booking.message}
            onChange={(event) => setBooking({ ...booking, message: event.target.value })}
          />
        </div>

        <div className="flex flex-col gap-2 justify-center content-center items-center">
          <Button
            type="submit"
            disabled={submitting}
            onClick={async () => {
              setSubmitting(true);
              setErrors({ ...initialErrors });
              if (typeof booking.name !== 'string' || booking.name === '') {
                errors.name = 'Please enter your name.';
              }
              if (!isValidEmailAddress(booking.email)) {
                errors.email = 'Please enter a valid e-mailaddress.';
              }

              if (errors.name === '' && errors.email === '') {
                const savedBooking = await saveBooking(booking);
                if (savedBooking) {
                  await sendEmail(savedBooking);
                  setSuccess('Thank you for your request. We will get back to you soon.');
                } else {
                  errors.generic = 'Something went wrong.';
                }
              }

              setErrors({ ...errors });
              setSubmitting(false);
            }}
          >
            {submitting && (
              <svg
                className="animate-spin ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            )}
            Request reservation
          </Button>
          {success !== '' && <div className="flex text-center items-center text-sm">{success}</div>}
        </div>

        {/* <Footer /> */}
      </div>
    </div>
  );
};
