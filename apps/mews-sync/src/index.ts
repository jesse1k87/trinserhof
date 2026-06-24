import dotenv from 'dotenv';
import { fetchReservations } from './mews';

dotenv.config();

const main = async () => {
  const reservations = await fetchReservations();
  console.log(`Fetched ${reservations.length} reservation(s) from Mews.`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
