import * as React from 'react';
import { getDb, type Room as RoomRow } from '@trinserhof/supabase-db';
import { Room } from '@trinserhof/types';

const toRoom = (row: RoomRow): Room => ({
  id: row.id,
  type: row.type,
  maxCustomers: row.maxCustomers,
  floor: row.floor,
  color: row.color,
  balcony: row.balcony ?? undefined,
  tv: row.tv ?? undefined,
  shower: row.shower ?? undefined,
  bathtub: row.bathtub ?? undefined,
  toilet: row.toilet ?? undefined,
  phone: row.phone ?? undefined,
  desk: row.desk ?? undefined,
  mountainView: row.mountainView ?? undefined,
  kingBed: row.kingBed ?? undefined,
  queenBed: row.queenBed ?? undefined,
  singleBed: row.singleBed ?? undefined,
  sleepSofa: row.sleepSofa ?? undefined,
  spaces: row.spaces ?? undefined,
});

const useRooms = () => {
  const [rooms, setRooms] = React.useState<Room[]>([]);

  React.useEffect(() => {
    let active = true;

    getDb()
      .room.findMany()
      .then((rows: RoomRow[]) => {
        if (active) {
          setRooms(rows.map(toRoom).sort((a, b) => Number(a.id) - Number(b.id)));
        }
      })
      .catch((error: unknown) => {
        console.error(error);
      });

    return () => {
      active = false;
    };
  }, []);

  return rooms;
};

export default useRooms;
