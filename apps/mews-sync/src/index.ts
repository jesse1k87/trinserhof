import dotenv from 'dotenv';
import { fetchReservations } from './mews';

dotenv.config();

const main = async () => {
  const reservations = await fetchReservations();
  console.log(`Fetched ${reservations.length} reservation(s) from Mews.`);

  // TODO: map each reservation to a Booking (channel: 'MEWS') and call
  // upsertBooking from ./firebase, once the Mews reservation shape is known.
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
