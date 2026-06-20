import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { fetchReservations } from './mews';
import {
  mewsGetAllReservationsResponseFixture,
  mewsReservationFixture,
} from './__fixtures__/mewsReservations';

const jsonResponse = (body: unknown, init: { ok?: boolean; status?: number } = {}) => ({
  ok: init.ok ?? true,
  status: init.status ?? 200,
  json: async () => body,
  text: async () => JSON.stringify(body),
});

describe('fetchReservations', () => {
  const originalEnv = { ...process.env };
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
    delete process.env.MEWS_CLIENT_TOKEN;
    delete process.env.MEWS_ACCESS_TOKEN;
    delete process.env.MEWS_SERVICE_ID;
    delete process.env.MEWS_BASE_URL;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.unstubAllGlobals();
  });

  const setCredentials = () => {
    process.env.MEWS_CLIENT_TOKEN = 'client-token';
    process.env.MEWS_ACCESS_TOKEN = 'access-token';
    process.env.MEWS_SERVICE_ID = 'service-id';
  };

  it('throws when MEWS_CLIENT_TOKEN is missing', async () => {
    process.env.MEWS_ACCESS_TOKEN = 'access-token';
    process.env.MEWS_SERVICE_ID = 'service-id';
    await expect(fetchReservations()).rejects.toThrow(
      'MEWS_CLIENT_TOKEN, MEWS_ACCESS_TOKEN, and MEWS_SERVICE_ID must be set in .env',
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('throws when MEWS_ACCESS_TOKEN is missing', async () => {
    process.env.MEWS_CLIENT_TOKEN = 'client-token';
    process.env.MEWS_SERVICE_ID = 'service-id';
    await expect(fetchReservations()).rejects.toThrow(
      'MEWS_CLIENT_TOKEN, MEWS_ACCESS_TOKEN, and MEWS_SERVICE_ID must be set in .env',
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('throws when MEWS_SERVICE_ID is missing', async () => {
    process.env.MEWS_CLIENT_TOKEN = 'client-token';
    process.env.MEWS_ACCESS_TOKEN = 'access-token';
    await expect(fetchReservations()).rejects.toThrow(
      'MEWS_CLIENT_TOKEN, MEWS_ACCESS_TOKEN, and MEWS_SERVICE_ID must be set in .env',
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('posts the documented Mews Connector API request envelope', async () => {
    setCredentials();
    fetchMock.mockResolvedValue(jsonResponse(mewsGetAllReservationsResponseFixture));

    await fetchReservations();

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.mews-demo.com/api/connector/v1/reservations/getAll/2023-06-06',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ClientToken: 'client-token',
          AccessToken: 'access-token',
          Client: 'trinserhof-mews-sync 1.0.0',
          ServiceIds: ['service-id'],
        }),
      },
    );
  });

  it('uses MEWS_BASE_URL when set, e.g. to target production instead of the demo sandbox', async () => {
    setCredentials();
    process.env.MEWS_BASE_URL = 'https://api.mews.com';
    fetchMock.mockResolvedValue(jsonResponse(mewsGetAllReservationsResponseFixture));

    await fetchReservations();

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.mews.com/api/connector/v1/reservations/getAll/2023-06-06',
      expect.anything(),
    );
  });

  it('returns the reservations from a successful response', async () => {
    setCredentials();
    fetchMock.mockResolvedValue(jsonResponse(mewsGetAllReservationsResponseFixture));

    const result = await fetchReservations();

    expect(result).toEqual([mewsReservationFixture]);
  });

  it('throws with the status and body when the API responds with an error', async () => {
    setCredentials();
    fetchMock.mockResolvedValue(
      jsonResponse({ Message: 'Invalid access token.' }, { ok: false, status: 401 }),
    );

    await expect(fetchReservations()).rejects.toThrow(
      'Mews API request failed with status 401: {"Message":"Invalid access token."}',
    );
  });

  it('propagates network errors from fetch', async () => {
    setCredentials();
    fetchMock.mockRejectedValue(new Error('network unreachable'));

    await expect(fetchReservations()).rejects.toThrow('network unreachable');
  });
});
