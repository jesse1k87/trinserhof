import * as React from 'react';
import { getSupabaseClient, type RoomType as RoomTypeRow } from '@trinserhof/supabase';
import { RoomType } from '@trinserhof/types';

const toRoomType = (row: RoomTypeRow): RoomType => ({
  id: row.id,
  label: row.label,
  description: row.description ?? undefined,
  basePrice: row.basePrice,
});

const useRoomTypes = () => {
  const [roomTypes, setRoomTypes] = React.useState<RoomType[]>([]);

  React.useEffect(() => {
    let active = true;

    getSupabaseClient()
      .from('RoomType')
      .select('*')
      .then(({ data, error }: { data: RoomTypeRow[] | null; error: unknown }) => {
        if (error) throw error;
        if (active) {
          setRoomTypes(
            (data ?? []).map(toRoomType).sort((a, b) => a.label.localeCompare(b.label)),
          );
        }
      })
      .catch((error: unknown) => {
        console.error(error);
      });

    return () => {
      active = false;
    };
  }, []);

  return roomTypes;
};

export default useRoomTypes;
