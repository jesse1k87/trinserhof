import * as React from 'react';
import { Locale, Prices, Room, RoomId } from '@trinserhof/types';
import { formatCurrency } from '@trinserhof/helpers';
import { CheckIcon, HomeIcon, SmallText } from '@trinserhof/ui';
import { SearchableSelect } from './SearchableSelect';

export const RoomSelector = ({
  rooms,
  selectedRoomId,
  onSelect,
  enabled,
  prices,
  locale,
}: {
  rooms: Room[];
  selectedRoomId: RoomId;
  onSelect: (room: Room) => void;
  enabled: boolean;
  prices: Prices;
  locale: Locale;
}) => {
  const selectedRoom = rooms.find((room) => room.id === selectedRoomId);

  return (
    <SearchableSelect
      items={rooms}
      triggerLabel={selectedRoom ? `Room ${selectedRoom.id}` : 'Select a room'}
      enabled={enabled}
      onSelect={onSelect}
      getItemKey={(room) => room.id}
      getItemKeywords={(room) => [room.id, room.type]}
      searchPlaceholder="Search rooms…"
      emptyLabel="No rooms found."
      renderItem={({ id, type }) => (
        <>
          <div className="flex items-center gap-3">
            <HomeIcon className="size-4 shrink-0" />
            <div>
              Room {id}
              <SmallText>
                {prices.base[type] !== undefined
                  ? formatCurrency(prices.base[type], 2, locale)
                  : 'No price set'}
              </SmallText>
            </div>
          </div>
          <CheckIcon
            className={`ml-auto h-4 w-4 ${id === selectedRoomId ? 'opacity-100' : 'opacity-0'}`}
          />
        </>
      )}
    />
  );
};
