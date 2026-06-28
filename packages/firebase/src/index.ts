import { User, type Role, canPerform, userSchema } from '@trinserhof/types';
import { getAuth } from 'firebase/auth';
import { getDatabase, ref, set, get, update } from 'firebase/database';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { uuidv4 } from '@trinserhof/helpers';
import { FIREBASE_CONFIG } from '@trinserhof/constants';

const app = getApps().length ? getApp() : initializeApp(FIREBASE_CONFIG);
const db = getDatabase(app);
export const getDb = () => db;

const auth = getAuth(app);

export const setUserRole = async (userId: string, role: Role) => {
  const email = auth.currentUser?.email;
  if (email !== 'jesse1k87@gmail.com') {
    throw new Error("Only the owner is allowed to change another user's role.");
  }
  await update(ref(getDb(), `users/${userId}`), { role });
};

export const addUser = async (email: string, role: Role) => {
  const actorEmail = auth.currentUser?.email;
  if (!actorEmail) {
    throw new Error('You must be signed in to add a user.');
  }

  const users: Record<string, User> = (await get(ref(getDb(), 'users'))).val() ?? {};
  const normalizedActorEmail = actorEmail.toLowerCase().trim();
  const actor = Object.values(users).find(
    (existing) => existing.email?.toLowerCase().trim() === normalizedActorEmail,
  );

  if (!actor || !canPerform(actor.role, 'USER', 'CREATE')) {
    throw new Error('Only an owner is allowed to add new users.');
  }

  const normalizedEmail = email.toLowerCase().trim();
  const alreadyExists = Object.values(users).some(
    (existing) => existing.email?.toLowerCase().trim() === normalizedEmail,
  );
  if (alreadyExists) {
    throw new Error('A user with this email already exists.');
  }

  const newUser: User = { id: uuidv4(), email: normalizedEmail, role };

  const validation = userSchema.safeParse(newUser);
  if (!validation.success) {
    throw new Error(
      `Invalid user data: ${validation.error.issues.map((issue) => issue.message).join(', ')}`,
    );
  }

  await set(ref(getDb(), `users/${newUser.id}`), newUser);
  return newUser;
};
