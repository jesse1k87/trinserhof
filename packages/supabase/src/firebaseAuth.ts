import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';
import { FIREBASE_CONFIG } from '@trinserhof/constants';

// Firebase Authentication is wired into Supabase as a Third-Party Auth provider:
// users sign in through Firebase (Google) and the Supabase client forwards the
// Firebase ID token as its access token (see client.ts's `accessToken`) so
// Postgres Row Level Security can authorize each request as that user.
//
// The Firebase app is created lazily and idempotently. @trinserhof/firebase
// initializes the same default app for its Realtime Database access, so
// whichever module loads first wins and the other reuses it via getApp().
let app: FirebaseApp | undefined;
let authInstance: Auth | undefined;

const getFirebaseApp = (): FirebaseApp => {
  if (!app) {
    app = getApps().length ? getApp() : initializeApp(FIREBASE_CONFIG);
  }
  return app;
};

export const getFirebaseAuth = (): Auth => {
  if (!authInstance) {
    authInstance = getAuth(getFirebaseApp());
  }
  return authInstance;
};

export const googleAuthProvider = new GoogleAuthProvider();

// The Supabase client's `accessToken` provider: the signed-in Firebase user's
// ID token, or null when nobody is signed in (e.g. server-side scripts), in
// which case Supabase falls back to the anon key.
export const getFirebaseIdToken = async (): Promise<string | null> => {
  const user = getFirebaseAuth().currentUser;
  return user ? user.getIdToken() : null;
};
