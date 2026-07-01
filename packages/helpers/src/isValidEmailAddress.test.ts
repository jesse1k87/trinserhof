import { describe, expect, it } from 'vitest';
import { isValidEmailAddress } from './isValidEmailAddress';

describe('isValidEmailAddress', () => {
  it.each(['guest@example.com', 'a.b+c@sub.example.co.uk', 'guest@trinserhof.at'])(
    'accepts %s',
    (email) => {
      expect(isValidEmailAddress(email)).toBe(true);
    },
  );

  it.each([
    '',
    'guest',
    'guest@',
    '@example.com',
    'guest@example',
    'guest @example.com',
    'guest@exa mple.com',
  ])('rejects %s', (email) => {
    expect(isValidEmailAddress(email)).toBe(false);
  });
});
