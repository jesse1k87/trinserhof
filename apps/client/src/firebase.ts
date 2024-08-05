import { initializeApp } from 'firebase/app';
import { FIREBASE_CONFIG } from '@bookings/constants';
import { getDatabase } from 'firebase/database';

const app = initializeApp(FIREBASE_CONFIG['production']);

const db = getDatabase(app);

export const getDb = () => db;
