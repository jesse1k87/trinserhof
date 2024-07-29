import { initializeApp } from 'firebase/app';
import { FIREBASE_CONFIG } from 'src/constants/firebaseConfig';
import { getDatabase } from 'firebase/database';

const SOURCE = 'DEV';

const app = initializeApp(FIREBASE_CONFIG[SOURCE]);

const db = getDatabase(app);

export const getDb = () => db;
