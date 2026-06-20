const DEFAULT_BASE_URL = 'https://api.mews-demo.com';
const RESERVATIONS_ENDPOINT = '/api/connector/v1/reservations/getAll/2023-06-06';
const CLIENT_NAME = 'trinserhof-mews-sync 1.0.0';

export type MewsReservationState =
  | 'Enquired'
  | 'Optional'
  | 'Confirmed'
  | 'Started'
  | 'Processed'
  | 'Canceled';

export interface MewsReservation {
  Id: string;
  Number: string;
  State: MewsReservationState;
  CustomerId: string;
  AssignedResourceId: string | null;
  RequestedCategoryId: string | null;
  StartUtc: string;
  EndUtc: string;
  CreatedUtc: string;
  AdultCount: number;
  ChildCount: number;
  Notes: string | null;
  GroupId: string | null;
  RateId: string | null;
  VoucherCode: string | null;
  Origin: string;
}

interface GetAllReservationsResponse {
  Reservations: MewsReservation[];
}

// Request/response shape follows Mews's publicly documented Connector API
// (reservations/getAll, version 2023-06-06) but is unverified against a live
// sandbox; re-check field names once real Mews credentials arrive.
export const fetchReservations = async (): Promise<MewsReservation[]> => {
  const clientToken = process.env.MEWS_CLIENT_TOKEN;
  const accessToken = process.env.MEWS_ACCESS_TOKEN;
  const serviceId = process.env.MEWS_SERVICE_ID;

  if (!clientToken || !accessToken || !serviceId) {
    throw new Error(
      'MEWS_CLIENT_TOKEN, MEWS_ACCESS_TOKEN, and MEWS_SERVICE_ID must be set in .env',
    );
  }

  const baseUrl = process.env.MEWS_BASE_URL || DEFAULT_BASE_URL;

  const response = await fetch(`${baseUrl}${RESERVATIONS_ENDPOINT}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ClientToken: clientToken,
      AccessToken: accessToken,
      Client: CLIENT_NAME,
      ServiceIds: [serviceId],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Mews API request failed with status ${response.status}: ${body}`);
  }

  const data = (await response.json()) as GetAllReservationsResponse;
  return data.Reservations;
};
