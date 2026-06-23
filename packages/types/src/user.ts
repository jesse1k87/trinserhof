import { z } from 'zod';

// A user record in Firebase's `users` collection — the source of truth for
// access: every allowed account has a user record, and the `isAdmin` flag marks
// the subset that may edit.
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
