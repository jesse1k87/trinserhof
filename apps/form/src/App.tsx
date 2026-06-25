import './index.css';
import * as React from 'react';
import { getNewBooking, getNewCustomer, isValidEmailAddress } from '@trinserhof/helpers';
import { Booking } from '@trinserhof/types';
import { BookingPartyFields, Button, Input } from '@trinserhof/ui';
import { saveBooking, saveCustomer } from '@trinserhof/database';

export const App = () => {
  const initialErrors = { email: '', generic: '' };
  const [errors, setErrors] = React.useState<Record<'email' | 'generic', string>>(initialErrors);
  const [success, setSuccess] = React.useState<string>('');

  const [email, setEmail] = React.useState('');
  const [booking, setBooking] = React.useState<Booking>(getNewBooking());
  const [submitting, setSubmitting] = React.useState<boolean>(false);

  return (
    <div className="flex flex-col w-full content-center items-center">
      <div className="flex flex-col grid gap-4 p-6 grid-cols-1 content-start min-w-[280px] max-w-[280px]">
        {/* <div className="flex flex-row justify-center">
          <img src="hotel-trinserhof.png" className="my-4 max-h-[100px]" />
        </div> */}
        <BookingPartyFields
          booking={booking}
          disabled={submitting}
          onChange={(changes) => setBooking({ ...booking, ...changes })}
        />

        <div className="flex flex-col w-full grid gap-1">
          <div className="pt-1 text-xs text-muted-foreground">E-mail</div>
          <Input
            placeholder="E-mail"
            value={email}
            disabled={submitting}
            className="bg-background"
            onChange={(event) => {
              setErrors({ ...errors, email: '' });
              setEmail(event.target.value);
            }}
          />
          {errors.email !== '' && (
            <p className="text-[0.8rem] font-medium text-destructive">{errors.email}</p>
          )}
        </div>

        <div className="flex flex-col gap-2 justify-center content-center items-center">
          <Button
            type="submit"
            disabled={submitting}
            onClick={async () => {
              setSubmitting(true);
              setErrors({ ...initialErrors });
              if (!isValidEmailAddress(email)) {
                errors.email = 'Please enter a valid e-mailaddress.';
              }

              if (errors.email === '') {
                try {
                  const customer = await saveCustomer({ ...getNewCustomer(), email });
                  await saveBooking({ ...booking, customers: [customer.id] });
                  setSuccess('Thank you for your request. We will get back to you soon.');
                } catch (error) {
                  console.error(error);
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
