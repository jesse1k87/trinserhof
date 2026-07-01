import * as React from 'react';
import { Locale, Prices, Room, RoomId } from '@trinserhof/types';
import { formatCurrency } from '@trinserhof/helpers';
import { Button } from '@trinserhof/ui';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@trinserhof/ui/src/components/command';
import { Popover, PopoverContent, PopoverTrigger } from '@trinserhof/ui/src/components/popover';
import { CheckIcon, HomeIcon, SortIcon } from '@trinserhof/ui';
import { SmallText } from '@trinserhof/ui';

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
  const [open, setOpen] = React.useState(false);
  const searchInputRef = React.useRef<HTMLInputElement | null>(null);

  const selectedRoom = rooms.find((room) => room.id === selectedRoomId);

  // The popover content stays mounted across opens (native popover toggle, not
  // conditional render), so `autoFocus` on the input only fires once - focus it
  // manually every time the popover opens instead.
  React.useEffect(() => {
    if (open) searchInputRef.current?.focus();
  }, [open]);

  const handleSelect = (room: Room) => {
    onSelect(room);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          role="combobox"
          aria-expanded={open}
          disabled={!enabled}
          className="justify-between hover:cursor-pointer"
        >
          {selectedRoom ? `Room ${selectedRoom.id}` : 'Select a room'}
          <SortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0">
        <Command>
          <CommandInput ref={searchInputRef} placeholder="Search rooms…" className="h-9" />
          <CommandList>
            <CommandEmpty>No rooms found.</CommandEmpty>
            <CommandGroup>
              {rooms.map((room) => {
                const { id, type } = room;
                return (
                  <CommandItem
                    key={id}
                    value={id}
                    keywords={[id, type]}
                    onSelect={() => handleSelect(room)}
                  >
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
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
