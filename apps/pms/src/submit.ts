import { type Booking } from '@trinserhof/types';

export const submit = ({
  booking,
  afterSuccess,
  afterError,
}: {
  booking: Pick<
    Booking,
    'email' | 'checkIn' | 'checkOut' | 'adults' | 'children' | 'babies' | 'pets'
  >;
  afterSuccess: () => void;
  afterError: (error: string) => void;
}) => {
  fetch('http://127.0.0.1:4000/submit', {
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
    .then(() => afterSuccess())
    .catch(({ error }) => afterError(error));
};
