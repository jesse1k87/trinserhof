import { describe, expect, it } from 'vitest';
import { User } from '@trinserhof/types';
import { seedUsers, UserSeed } from './seedUsers';

const source: UserSeed[] = [
  { email: 'owner@example.com', isAdmin: true },
  { email: 'staff@example.com', isAdmin: false },
];

describe('seedUsers', () => {
  it('creates every source user when none exist yet', () => {
    const result = seedUsers({}, source);
    expect(result.summary.totalUsers).toBe(2);
    expect(result.summary.newCount).toBe(2);
    expect(result.summary.updatedCount).toBe(0);
    expect(result.summary.changedCount).toBe(2);

    const created = Object.values(result.changedUsers);
    expect(created).toContainEqual(
      expect.objectContaining({ email: 'owner@example.com', isAdmin: true }),
    );
    expect(created).toContainEqual(
      expect.objectContaining({ email: 'staff@example.com', isAdmin: false }),
    );
    for (const user of created) {
      expect(user.id).toBeTruthy();
    }
  });

  it('skips users already present with a matching admin flag', () => {
    const existing: Record<string, User> = {
      a: { id: 'a', email: 'owner@example.com', isAdmin: true },
      b: { id: 'b', email: 'staff@example.com', isAdmin: false },
    };
    const result = seedUsers(existing, source);
    expect(result.summary.changedCount).toBe(0);
    expect(Object.keys(result.changedUsers)).toHaveLength(0);
  });

  it('matches existing users by normalized email regardless of casing', () => {
    const existing: Record<string, User> = {
      a: { id: 'a', email: 'OWNER@example.com', isAdmin: true },
      b: { id: 'b', email: '  staff@example.com  ', isAdmin: false },
    };
    const result = seedUsers(existing, source);
    // Email casing/whitespace differs from source, so both are rewritten in place.
    expect(result.summary.newCount).toBe(0);
    expect(result.summary.updatedCount).toBe(2);
    expect(result.changedUsers.a.email).toBe('owner@example.com');
    expect(result.changedUsers.a.id).toBe('a');
  });

  it('rewrites a drifted admin flag in place, keeping the id', () => {
    const existing: Record<string, User> = {
      a: { id: 'a', email: 'owner@example.com', isAdmin: false },
      b: { id: 'b', email: 'staff@example.com', isAdmin: false },
    };
    const result = seedUsers(existing, source);
    expect(result.summary.updatedCount).toBe(1);
    expect(result.summary.newCount).toBe(0);
    expect(result.changedUsers.a).toEqual({ id: 'a', email: 'owner@example.com', isAdmin: true });
    expect(result.changedUsers).not.toHaveProperty('b');
  });
});
