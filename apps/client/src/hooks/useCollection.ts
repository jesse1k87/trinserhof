import * as React from 'react';
import { initializeApp } from 'firebase/app';
import { getDatabase, onValue, ref } from 'firebase/database';

const app = initializeApp({
  apiKey: 'AIzaSyBNhfG50wEXA8XHmart7PeDIhZHH3qG0KA',
  authDomain: 'trinserhof-development.firebaseapp.com',
  databaseURL: 'https://trinserhof-development-default-rtdb.europe-west1.firebasedatabase.app',
  projectId: 'trinserhof-development',
  storageBucket: 'trinserhof-development.appspot.com',
  messagingSenderId: '724042182367',
  appId: '1:724042182367:web:a0be8aa0e623da4916036a',
  measurementId: 'G-FYXT53SHJQ',
});

const db = getDatabase(app);

const useCollection = (collectionName: string) => {
  const [documents, setDocuments] = React.useState([]);

  React.useEffect(() => {
    const unsubscribe = onValue(ref(db, 'bookings'), (snapshot) => {
      const documents = snapshot.val();
      const docsAsArray = Object.keys(documents).map((id) => documents[id]);
      setDocuments(docsAsArray);
    });

    return () => unsubscribe();
  }, [collectionName]);

  return documents;
};

export default useCollection;
