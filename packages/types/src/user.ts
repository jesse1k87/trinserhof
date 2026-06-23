import { z } from 'zod';
import { RoleEnum, type Role } from './role';

// A user record in Firebase's `users` collection — the source of truth for
// access: every allowed account has a user record, and its `role` (see ./role)
// determines what they may do. BLOCKED denies access entirely, VIEWER is
// read-only, and MANAGER or higher may edit.
export type User = {
  id: string;
  email: string;
  role: Role;
  // URL to the user's Google account profile image, captured on sign-in.
  profileImageUrl?: string;
};

export const userSchema = z.object({
  id: z.string({ message: 'Invalid id' }).trim().min(1),
  email: z.string({ message: 'Invalid email address' }).trim().email().min(1),
  role: RoleEnum,
  profileImageUrl: z.string({ message: 'Invalid profile image URL' }).trim().url().optional(),
});
