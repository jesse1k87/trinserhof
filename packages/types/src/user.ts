import { z } from 'zod';

// A user record in Firebase's `users` collection. Mirrors the hardcoded
// KNOWN_USERS / ADMINS lists in @trinserhof/constants: every allowed account is
// a user, and the `isAdmin` flag marks the subset that may edit.
export type User = {
  id: string;
  email: string;
  isAdmin: boolean;
  // URL to the user's Google account profile image, captured on sign-in.
  profileImageUrl?: string;
};

export const userSchema = z.object({
  id: z.string({ message: 'Invalid id' }).trim().min(1),
  email: z.string({ message: 'Invalid email address' }).trim().email().min(1),
  isAdmin: z.boolean({ message: 'Invalid isAdmin flag' }),
  profileImageUrl: z.string({ message: 'Invalid profile image URL' }).trim().url().optional(),
});
