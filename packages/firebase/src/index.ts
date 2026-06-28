import {
  User,
  type Role,
  type Theme,
  canEnterApp,
  canPerform,
  userSchema,
} from '@trinserhof/types';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
} from 'firebase/auth';
import { getDatabase, ref, set, get, update } from 'firebase/database';
import { initializeApp } from 'firebase/app';
import { uuidv4 } from '@trinserhof/helpers';
import { FIREBASE_CONFIG } from '@trinserhof/constants';
import { logAuditEvent } from '@trinserhof/supabase';

const app = initializeApp(FIREBASE_CONFIG);
const db = getDatabase(app);
export const getDb = () => db;

const auth = getAuth();
const provider = new GoogleAuthProvider();

export const overwriteRawData = async (data: unknown) => {
  const email = auth.currentUser?.email;
  if (email !== 'jesse1k87@gmail.com') {
    throw new Error('Only the owner is allowed to overwrite the raw database.');
  }
  await set(ref(getDb()), data);
};

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

export const setUserTheme = async (userId: string, theme: Theme) => {
  await update(ref(getDb(), `users/${userId}`), { theme });
};

export const storeUserProfileImage = async (email: string, photoURL?: string | null) => {
  if (!photoURL) return;

  try {
    const users = (await get(ref(getDb(), 'users'))).val() ?? {};
    const normalizedEmail = email.toLowerCase().trim();
    const entry = Object.entries(users).find(
      ([, value]) => (value as User).email?.toLowerCase().trim() === normalizedEmail,
    );
    if (!entry) return;

    const [id, existing] = entry as [string, User];
    if (existing.image === photoURL) return;

    await update(ref(getDb(), `users/${id}`), { image: photoURL });
  } catch (error) {
    console.error(error);
  }
};

export const getSignedInUser = (
  setUser: (user: User | null) => void,
  setError: (error: 'NOT_ALLOWED' | 'BLOCKED' | 'ERROR' | null) => void,
) =>
  onAuthStateChanged(auth, async (firebaseUser) => {
    setError(null);

    if (!firebaseUser?.email) {
      setUser(null);
      return;
    }

    const email = firebaseUser.email.toLowerCase().trim();

    try {
      const users: Record<string, User> = (await get(ref(getDb(), 'users'))).val() ?? {};
      let user = Object.values(users).find(
        (knownUser) => knownUser.email?.toLowerCase().trim() === email,
      );

      if (!user) {
        setError('NOT_ALLOWED');
        return;
      }

      if (!canEnterApp(user.role)) {
        setError('NOT_ALLOWED');
        return;
      }

      if (user.role === 'BLOCKED') {
        setError('BLOCKED');
        return;
      }

      setUser(user);
      storeUserProfileImage(firebaseUser.email, firebaseUser.photoURL);
    } catch (error) {
      console.error(error);
      setError('ERROR');
    }
  });

export const logOut = (setUser: (user: User | null) => void) => {
  // Capture the email before signing out — afterwards currentUser is null.
  const email = auth.currentUser?.email;
  signOut(auth)
    .then(() => {
      logAuditEvent('LOGOUT', email);
      setUser(null);
    })
    .catch((error) => {
      console.error(error);
      setUser(null);
    });
};

export const logIn = (onError?: (errorCode: string) => void) => {
  // Log the explicit sign-in action here (not in getSignedInUser's
  // onAuthStateChanged, which also fires on every page refresh/token restore).
  signInWithPopup(auth, provider)
    .then((credential) => logAuditEvent('LOGIN', credential.user.email))
    .catch((error) => {
      console.error(error);
      onError?.(error.code);
    });
};
