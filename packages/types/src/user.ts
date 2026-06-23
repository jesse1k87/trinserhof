import { z } from 'zod';

// A user record in Firebase's `users` collection. Mirrors the hardcoded
// KNOWN_USERS / ADMINS lists in @trinserhof/constants: every allowed account is
// a user, and the `isAdmin` flag marks the subset that may edit.
export type User = {
  id: string;
  email: string;
  isAdmin: boolean;
};

export const userSchema = z.object({
  id: z.string({ message: 'Invalid id' }).trim().min(1),
  email: z.string({ message: 'Invalid email address' }).trim().email().min(1),
  isAdmin: z.boolean({ message: 'Invalid isAdmin flag' }),
});
