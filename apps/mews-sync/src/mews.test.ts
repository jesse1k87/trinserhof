import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { fetchReservations } from './mews';

describe('fetchReservations', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env.MEWS_CLIENT_TOKEN;
    delete process.env.MEWS_ACCESS_TOKEN;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('throws when MEWS_CLIENT_TOKEN is missing', async () => {
    process.env.MEWS_ACCESS_TOKEN = 'access-token';
    await expect(fetchReservations()).rejects.toThrow(
      'MEWS_CLIENT_TOKEN and MEWS_ACCESS_TOKEN must be set in .env',
    );
  });

  it('throws when MEWS_ACCESS_TOKEN is missing', async () => {
    process.env.MEWS_CLIENT_TOKEN = 'client-token';
    await expect(fetchReservations()).rejects.toThrow(
      'MEWS_CLIENT_TOKEN and MEWS_ACCESS_TOKEN must be set in .env',
    );
  });

  it('throws not-implemented once credentials are present', async () => {
    process.env.MEWS_CLIENT_TOKEN = 'client-token';
    process.env.MEWS_ACCESS_TOKEN = 'access-token';
    await expect(fetchReservations()).rejects.toThrow('fetchReservations is not implemented yet');
  });
});
