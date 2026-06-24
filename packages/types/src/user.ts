import { z } from 'zod';
import { RoleEnum, type Role } from './role';

export const THEMES = ['light', 'dark'] as const;

export const ThemeEnum = z.enum(THEMES);

export type Theme = z.infer<typeof ThemeEnum>;

export type User = {
  id: string;
  email: string;
  role: Role;
  image?: string;
  theme?: Theme;
};

export const userSchema = z.object({
  id: z.string({ message: 'Invalid id' }).trim().min(1),
  email: z.string({ message: 'Invalid email address' }).trim().email().min(1),
  role: RoleEnum,
  image: z.string({ message: 'Invalid profile image URL' }).trim().url().optional(),
  theme: ThemeEnum.optional(),
});
