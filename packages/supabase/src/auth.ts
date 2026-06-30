import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import {
  canEnterApp,
  setRoleDefinitions,
  type Locale,
  type Theme,
  type User,
} from '@trinserhof/types';
import { getFirebaseAuth, googleAuthProvider } from './firebaseAuth';
import { getSupabaseClient, type Role as RoleRow, type User as UserRow } from './client';
// logAuditEvent lives in ./index; it is only ever read inside the async
// handlers below (never at module-init time), so the index <-> auth import
// cycle resolves fine via ESM live bindings.
import { logAuditEvent } from './index';

const toUser = (row: UserRow): User => ({
  id: row.id,
  email: row.email,
  role: row.role,
  image: row.image ?? undefined,
  theme: row.theme ?? undefined,
  locale: (row.locale as Locale | null) ?? undefined,
});

// Loads the role definitions (id -> name + granted permissions) from the Role
// table and registers them with @trinserhof/types so the synchronous permission
// checks (canEnterApp / canPerform / canMergeCustomers) can resolve a user's
// role id. Must run before those checks — getSignedInUser awaits it below.
export const loadRoleDefinitions = async (): Promise<void> => {
  const { data, error } = await getSupabaseClient().from('Role').select('*');
  if (error) throw error;
  const rows = (data ?? []) as RoleRow[];
  setRoleDefinitions(
    rows.map((row) => ({
      id: row.id,
      name: row.name,
      permissions: row.permissions ?? [],
    })),
  );
};

// Caches the Google profile photo onto the user's Supabase row when it changes,
// so avatars stay current (the @trinserhof/firebase Realtime Database
// equivalent used to do this on read).
const storeUserProfileImage = async (user: User, photoURL?: string | null) => {
  if (!photoURL || user.image === photoURL) return;
  try {
    const { error } = await getSupabaseClient()
      .from('User')
      .update({ image: photoURL })
      .eq('id', user.id);
    if (error) throw error;
  } catch (error) {
    console.error(error);
  }
};

// Resolves the signed-in user against the Supabase User table (the source of
// truth for who may sign in and at what role). Firebase Auth is the sign-in
// provider; its ID token authorizes the query via Supabase Third-Party Auth.
// Returns the Firebase onAuthStateChanged unsubscribe function.
export const getSignedInUser = (
  setUser: (user: User | null) => void,
  setError: (error: 'NOT_ALLOWED' | 'BLOCKED' | 'ERROR' | null) => void,
) =>
  onAuthStateChanged(getFirebaseAuth(), async (firebaseUser) => {
    setError(null);

    if (!firebaseUser?.email) {
      setUser(null);
      return;
    }

    const email = firebaseUser.email.toLowerCase().trim();

    try {
      // Load role definitions before any permission check below resolves.
      await loadRoleDefinitions();

      const { data, error } = await getSupabaseClient().from('User').select('*');
      if (error) throw error;

      const rows = (data ?? []) as UserRow[];
      const row = rows.find((knownUser) => knownUser.email?.toLowerCase().trim() === email);

      if (!row) {
        setUser(null);
        setError('NOT_ALLOWED');
        return;
      }

      const user = toUser(row);

      // A known user whose role grants no app access (e.g. the BLOCKED role) is
      // refused with the "restricted" message, distinct from an unknown account.
      if (!canEnterApp(user.role)) {
        setUser(null);
        setError('BLOCKED');
        return;
      }

      setUser(user);
      storeUserProfileImage(user, firebaseUser.photoURL);
    } catch (error) {
      console.error(error);
      // Resolve the user to null (not left undefined) so the app drops out of
      // its loading state and shows the login screen with the error, instead of
      // hanging on a spinner forever — e.g. if the Supabase query (or client
      // creation) throws.
      setUser(null);
      setError('ERROR');
    }
  });

export const logIn = (onError?: (errorCode: string) => void) => {
  // Sign in through Firebase (the Third-Party Auth provider). Afterwards the
  // Supabase client picks up the Firebase ID token automatically — see
  // client.ts's `accessToken`. The explicit sign-in is logged here (not in
  // getSignedInUser, whose listener also fires on every token restore/refresh).
  signInWithPopup(getFirebaseAuth(), googleAuthProvider)
    .then((credential) => logAuditEvent('LOGIN', credential.user.email))
    .catch((error) => {
      console.error(error);
      onError?.(error.code);
    });
};

export const logOut = (setUser: (user: User | null) => void) => {
  const auth = getFirebaseAuth();
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

export const setUserTheme = async (userId: string, theme: Theme) => {
  const { error } = await getSupabaseClient().from('User').update({ theme }).eq('id', userId);
  if (error) throw error;
};

export const setUserLocale = async (userId: string, locale: Locale) => {
  const { error } = await getSupabaseClient().from('User').update({ locale }).eq('id', userId);
  if (error) throw error;
};
