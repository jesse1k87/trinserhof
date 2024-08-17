import { getAmountOfNightsFromDateRange } from '@bookings/helpers';
import { Booking } from '@bookings/types';

export const sendEmail = async (booking: Booking) => {
  const checkIn = new Intl.DateTimeFormat('de-DE', {
    dateStyle: 'full',
  }).format(new Date(booking.checkIn));

  await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      service_id: 'service_3r80pvi',
      template_id: 'template_nj4b7u7',
      user_id: 'qQFIA4SWNkTzjp4Ul',
      template_params: {
        booking_email: booking.email,
        email_from_name: 'Hotel Trinserhof',
        email_from_address: 'hotel@trinserhof.com',
        email_reply_to: 'hotel@trinserhof.com',
        email_bcc: 'hotel@trinserhof.com',
        email_subject: `Copy of your reservation-request (${checkIn} ${booking.email})`,
        email_content: getEmailContent(booking),
      },
    }),
  })
    .then(async (res) => {
      if (res.ok) return res.json();
      return res.json().then((json) => Promise.reject(json));
    })
    .catch((error) => {
      return error;
    });
};

const getEmailContent = (booking: Booking) => {
  const checkIn = new Intl.DateTimeFormat('de-DE', {
    dateStyle: 'full',
  }).format(new Date(booking.checkIn));

  const checkOut = new Intl.DateTimeFormat('de-DE', {
    dateStyle: 'full',
  }).format(new Date(booking.checkOut));

  const nights = getAmountOfNightsFromDateRange({
    from: new Date(booking.checkIn),
    to: new Date(booking.checkOut),
  });

  const guests = [];

  if (booking.adults > 0) {
    guests.push(`${booking.adults > 1 ? `${booking.adults} adults` : `${booking.adults} adult`}`);
  }
  if (booking.children > 0) {
    guests.push(
      `${booking.children > 1 ? `${booking.children} children` : `${booking.children} child`}`,
    );
  }
  if (booking.babies > 0) {
    guests.push(`${booking.babies > 1 ? `${booking.babies} babies` : `${booking.babies} baby`}`);
  }
  if (booking.pets > 0) {
    guests.push(`${booking.pets > 1 ? `${booking.pets} pets` : `${booking.pets} pet`}`);
  }

  let guestsSentence = '';
  if (guests.length > 0) {
    const lastGuest = guests.pop();
    guestsSentence = ' for ' + guests.join(', ') + ' and ' + lastGuest;
  }

  const message =
    typeof booking.message === 'string' && booking.message !== ''
      ? `The message you left with the request: "${booking.message}".<br /><br />`
      : ``;

  return `<div style="font-family: Arial;font-size: 0.9em">
      Hello ${booking.name},<br />
      <br />
      Thank you for requesting your stay at Hotel Trinserhof from ${checkIn} to ${checkOut} (${nights} nights)${guestsSentence}.<br />
      <br />
      ${message}
      We will contact you soon after we processed your request.<br />
      <br />
      Schöne Grüße,<br />
      <br />
      Jennifer Covi<br />
      <br />
      <strong>Hotel Trinserhof</strong><br />
      Hotel & Restaurant<br />
      www.trinserhof.com<br />
      Trins 106, 6152 Trins<br />
      Tel.: 0043-(0)660 925 3326<br />
      <br />
      Trinserhof GmbH<br />
      ATU 78406903
    </div>`;
};
