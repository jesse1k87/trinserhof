// The single owner account allowed to overwrite the raw database directly
// (mirrors the ".write" rule in database.rules.json).
export const OWNER_EMAIL = 'jesse1k87@gmail.com';

export const ADMINS = [OWNER_EMAIL];

export const KNOWN_USERS = [
  ...ADMINS,
  'jennifer.m.covi@gmail.com',
  'jessica.covi@gmail.com',
  'harry.covi@gmail.com',
];
