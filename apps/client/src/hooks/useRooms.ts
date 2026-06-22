import * as React from 'react';
import { onValue, ref } from 'firebase/database';
import { getDb } from '@trinserhof/database';
import { Room } from '@trinserhof/types';

const useRooms = () => {
  const [rooms, setRooms] = React.useState<Room[]>([]);

  const db = getDb();

  React.useEffect(() => {
    const unsubscribe = onValue(
      ref(db, 'rooms'),
      (snapshot) => {
        const documents = snapshot.val() ?? {};
        const roomsAsArray: Room[] = Object.keys(documents)
          .map((id) => documents[id])
          .sort((a, b) => Number(a.id) - Number(b.id));

        setRooms(roomsAsArray);
      },
      (error) => {
        console.error(error);
      },
    );

    return () => unsubscribe();
  }, []);

  return rooms;
};

export default useRooms;
