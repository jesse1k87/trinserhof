// These values identify the Firebase project, not secrets — they're meant to
// ship in client-side bundles (https://firebase.google.com/docs/projects/api-keys).
// Only databaseURL differs between staging and production, so it's the one
// value still read from an env var.
export const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyCnUaGY69oeR5YdR9OwyguYPgGB0RyLoWs',
  appId: '1:1043164637160:web:3e88b90f9c5f1f0b66e65d',
  authDomain: 'trinserhof-bookings.firebaseapp.com',
  databaseURL: process.env.FIREBASE_DATABASE_URL,
  messagingSenderId: '1043164637160',
  projectId: 'trinserhof-bookings',
  storageBucket: 'trinserhof-bookings.firebasestorage.app',
};
