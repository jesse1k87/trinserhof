import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import type { Booking } from '@trinserhof/types';
import { getEmailContent, sendEmail } from './email';

const baseBooking: Booking = {
  id: 'booking-1',
  email: 'guest@example.com',
  checkIn: '2026-07-01',
  checkOut: '2026-07-05',
  status: 'PENDING',
  roomId: '101',
  channel: 'EMAIL',
  adults: 1,
  children: 0,
  babies: 0,
  pets: 0,
  halbpension: false,
  price: 0,
  priceFixed: '0',
  name: 'Jane Doe',
  className: '',
  contact: '',
  content: '',
  deleted: false,
  end: '',
  group: '',
  start: '',
  updated: '',
};

describe('getEmailContent', () => {
  it('describes a single adult without a stray "and" or double space', () => {
    const content = getEmailContent(baseBooking);
    expect(content).toContain('Jane Doe');
    expect(content).toContain('Mittwoch, 1. Juli 2026 to Sonntag, 5. Juli 2026');
    expect(content).toContain('for 1 adult.');
  });

  it('joins multiple guest types with commas and "and"', () => {
    const content = getEmailContent({ ...baseBooking, adults: 2, children: 1, pets: 1 });
    expect(content).toContain('for 2 adults, 1 child and 1 pet.');
  });

  it('omits the guests sentence entirely when there are no guests', () => {
    const content = getEmailContent({ ...baseBooking, adults: 0 });
    expect(content).toContain('(4 nights).');
  });

  it('includes the message when one is present', () => {
    const content = getEmailContent({ ...baseBooking, message: 'Late check-in please.' });
    expect(content).toContain('The message you left with the request: "Late check-in please."');
  });

  it('omits the message block when there is none', () => {
    const content = getEmailContent({ ...baseBooking, message: '' });
    expect(content).not.toContain('The message you left with the request');
  });
});

describe('sendEmail', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('posts the booking details to the EmailJS endpoint', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ status: 200 }),
    } as Response);

    await sendEmail(baseBooking);

    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, options] = vi.mocked(fetch).mock.calls[0];
    expect(url).toBe('https://api.emailjs.com/api/v1.0/email/send');

    const body = JSON.parse(options?.body as string);
    expect(body.template_params.booking_email).toBe('guest@example.com');
    expect(body.template_params.email_subject).toBe(
      'Copy of your reservation-request (Mittwoch, 1. Juli 2026 guest@example.com)',
    );
    expect(body.template_params.email_content).toBe(getEmailContent(baseBooking));
  });

  it('resolves with the parsed response when the request succeeds', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ status: 200 }),
    } as Response);

    await expect(sendEmail(baseBooking)).resolves.toEqual({ status: 200 });
  });

  it('rejects with the error body when the request fails', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Bad request' }),
    } as Response);

    await expect(sendEmail(baseBooking)).rejects.toEqual({ error: 'Bad request' });
  });
});
