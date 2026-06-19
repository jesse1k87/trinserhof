// TODO: replace with the real Mews Connector API request once sandbox credentials
// and a sample reservations response are available. Endpoint/payload shape is not
// guessed at here on purpose.
export const fetchReservations = async (): Promise<unknown[]> => {
  const clientToken = process.env.MEWS_CLIENT_TOKEN;
  const accessToken = process.env.MEWS_ACCESS_TOKEN;

  if (!clientToken || !accessToken) {
    throw new Error('MEWS_CLIENT_TOKEN and MEWS_ACCESS_TOKEN must be set in .env');
  }

  throw new Error('fetchReservations is not implemented yet');
};
