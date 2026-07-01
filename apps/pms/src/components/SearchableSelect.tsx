import * as React from 'react';
import { Button, SortIcon } from '@trinserhof/ui';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@trinserhof/ui/src/components/command';
import { Popover, PopoverContent, PopoverTrigger } from '@trinserhof/ui/src/components/popover';

// Shared searchable combobox popover: a disabled-aware trigger button, an
// auto-focusing search input and a filtered command list. RoomSelector and
// CustomerSelect both build on it so the popover/focus/search plumbing lives in
// one place; they only supply how each item looks and what happens on select.
export const SearchableSelect = <T,>({
  items,
  triggerLabel,
  enabled,
  onSelect,
  getItemKey,
  getItemKeywords,
  renderItem,
  searchPlaceholder,
  emptyLabel,
  closeOnSelect = true,
  onOpenChange,
  footer,
  renderOverride,
}: {
  items: T[];
  triggerLabel: React.ReactNode;
  enabled: boolean;
  onSelect: (item: T) => void;
  getItemKey: (item: T) => string;
  getItemKeywords?: (item: T) => string[];
  renderItem: (item: T) => React.ReactNode;
  searchPlaceholder: string;
  emptyLabel: string;
  // Whether picking an item closes the popover. Multi-select callers keep it
  // open so several items can be toggled before dismissing it.
  closeOnSelect?: boolean;
  onOpenChange?: (open: boolean) => void;
  // Rendered below the command list (e.g. a "create new" action). Receives the
  // current search text and a `close` helper.
  footer?: (context: { search: string; close: () => void }) => React.ReactNode;
  // When it returns non-null, its content replaces the search list entirely
  // (e.g. an inline create form). Receives a `close` helper.
  renderOverride?: (context: { close: () => void }) => React.ReactNode;
}) => {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const searchInputRef = React.useRef<HTMLInputElement | null>(null);

  const changeOpen = (next: boolean) => {
    setOpen(next);
    if (!next) setSearch('');
    onOpenChange?.(next);
  };
  const close = () => changeOpen(false);

  const overrideContent = renderOverride?.({ close }) ?? null;
  const hasOverride = overrideContent !== null;

  // The popover content stays mounted across opens (native popover toggle, not
  // conditional render), so `autoFocus` on the input only fires once - focus it
  // manually every time the popover opens instead. Skip while override content
  // is shown, since the search input isn't rendered then.
  React.useEffect(() => {
    if (open && !hasOverride) searchInputRef.current?.focus();
  }, [open, hasOverride]);

  const handleSelect = (item: T) => {
    onSelect(item);
    if (closeOnSelect) close();
  };

  return (
    <Popover open={open} onOpenChange={changeOpen}>
      <PopoverTrigger asChild>
        <Button
          role="combobox"
          aria-expanded={open}
          disabled={!enabled}
          className="justify-between hover:cursor-pointer"
        >
          {triggerLabel}
          <SortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0">
        {overrideContent ?? (
          <>
            <Command>
              <CommandInput
                ref={searchInputRef}
                placeholder={searchPlaceholder}
                className="h-9"
                value={search}
                onValueChange={setSearch}
              />
              <CommandList>
                <CommandEmpty>{emptyLabel}</CommandEmpty>
                <CommandGroup>
                  {items.map((item) => (
                    <CommandItem
                      key={getItemKey(item)}
                      value={getItemKey(item)}
                      keywords={getItemKeywords?.(item)}
                      onSelect={() => handleSelect(item)}
                    >
                      {renderItem(item)}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
            {footer?.({ search, close })}
          </>
        )}
      </PopoverContent>
    </Popover>
  );
};
