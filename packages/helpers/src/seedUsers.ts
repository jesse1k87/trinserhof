import { User } from '@trinserhof/types';
import { uuidv4 } from './uuidv4';

/** A source user to seed: just the email and whether they're an admin. */
export type UserSeed = { email: string; isAdmin: boolean };

export type UserSeedResult = {
  /** Users that need writing (new or changed vs. the source list), keyed by id. */
  changedUsers: Record<string, User>;
  summary: { totalUsers: number; changedCount: number; newCount: number; updatedCount: number };
};

/**
 * Migration: copies the (hardcoded) allowed-user list — KNOWN_USERS / ADMINS in
 * @trinserhof/constants, passed in as `sourceUsers` — into Firebase's
 * users/$userId so user/admin access can be read at runtime instead of being
 * baked into the bundle. Pure: no Firebase, given the current users map and the
 * source list it returns the records to write.
 *
 * Users are matched by normalized (lowercased, trimmed) email. Idempotent:
 * users already present with a matching `isAdmin` flag are skipped; a drifted
 * `isAdmin` (or email casing) is rewritten in place keeping the existing id;
 * unknown emails get a fresh uuid.
 */
export const seedUsers = (
  existingUsers: Record<string, User>,
  sourceUsers: UserSeed[],
): UserSeedResult => {
  const changedUsers: Record<string, User> = {};

  // Index existing users by normalized email.
  const emailToId = new Map<string, string>();
  for (const [id, user] of Object.entries(existingUsers)) {
    if (user.email) emailToId.set(user.email.toLowerCase().trim(), id);
  }

  let newCount = 0;
  let updatedCount = 0;

  for (const source of sourceUsers) {
    const normalizedEmail = source.email.toLowerCase().trim();
    const existingId = emailToId.get(normalizedEmail);

    if (existingId) {
      const existing = existingUsers[existingId];
      if (existing.isAdmin !== source.isAdmin || existing.email !== source.email) {
        changedUsers[existingId] = { ...existing, email: source.email, isAdmin: source.isAdmin };
        updatedCount++;
      }
    } else {
      const id = uuidv4();
      changedUsers[id] = { id, email: source.email, isAdmin: source.isAdmin };
      emailToId.set(normalizedEmail, id);
      newCount++;
    }
  }

  return {
    changedUsers,
    summary: {
      totalUsers: sourceUsers.length,
      changedCount: Object.keys(changedUsers).length,
      newCount,
      updatedCount,
    },
  };
};
