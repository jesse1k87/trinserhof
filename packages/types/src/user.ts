import { z } from 'zod';

// A user record in Firebase's `users` collection — the source of truth for
// access: every allowed account has a user record, the `isAdmin` flag marks the
// subset that may edit, and the `blocked` flag marks accounts that are denied
// access entirely (even though a record exists). `blocked` is optional; a
// missing value is treated as not blocked.
export type User = {
  id: string;
  email: string;
  isAdmin: boolean;
  blocked?: boolean;
  // URL to the user's Google account profile image, captured on sign-in.
  profileImageUrl?: string;
};

export const userSchema = z.object({
  id: z.string({ message: 'Invalid id' }).trim().min(1),
  email: z.string({ message: 'Invalid email address' }).trim().email().min(1),
  isAdmin: z.boolean({ message: 'Invalid isAdmin flag' }),
  blocked: z.boolean({ message: 'Invalid blocked flag' }).optional(),
  profileImageUrl: z.string({ message: 'Invalid profile image URL' }).trim().url().optional(),
});
