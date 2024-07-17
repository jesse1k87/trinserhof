import { type Booking } from '@bookings/types';

export const submit = ({
  booking,
  afterSuccess,
  afterError,
}: {
  booking: Pick<
    Booking,
    'email' | 'checkIn' | 'checkOut' | 'roomType' | 'adults' | 'children' | 'pets'
  >;
  afterSuccess: () => void;
  afterError: (error: string) => void;
}) => {
  const baseUrl =
    window.location.hostname === 'localhost' ? 'http://localhost:4000' : 'https://trinserhof.com';

  fetch(`${baseUrl}/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(booking),
  })
    .then(async (res) => {
      if (res.ok) return res.json();
      return res.json().then((json) => Promise.reject(json));
    })
    .then((res) => afterSuccess())
    .catch(({ error }) => afterError(error));
};
