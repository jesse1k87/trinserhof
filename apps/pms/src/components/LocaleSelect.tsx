import * as React from 'react';
import { LOCALES, type Locale } from '@trinserhof/types';
import {
  Button,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  ICONS,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@trinserhof/ui';

// "de-AT" -> "German (Austria)". Falls back to the raw tag if Intl can't
// resolve a display name for it (e.g. an unrecognized region/script).
const localeLabel = (locale: string): string => {
  try {
    const [language, region] = locale.split('-');
    const languageName =
      new Intl.DisplayNames(['en'], { type: 'language' }).of(language) ?? language;
    const regionName = region
      ? new Intl.DisplayNames(['en'], { type: 'region' }).of(region)
      : undefined;
    return regionName ? `${languageName} (${regionName})` : languageName;
  } catch {
    return locale;
  }
};

export const LocaleSelect = ({
  value,
  onSelect,
  disabled,
}: {
  value: Locale;
  onSelect: (locale: Locale) => void;
  disabled?: boolean;
}) => {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between hover:cursor-pointer"
        >
          {`${localeLabel(value)} (${value})`}
          <ICONS.sort className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0">
        <Command>
          <CommandInput placeholder="Search locales…" className="h-9" />
          <CommandList>
            <CommandEmpty>No locales found.</CommandEmpty>
            <CommandGroup>
              {LOCALES.map((locale) => (
                <CommandItem
                  key={locale}
                  value={locale}
                  keywords={[localeLabel(locale), locale]}
                  onSelect={() => {
                    onSelect(locale);
                    setOpen(false);
                  }}
                >
                  {`${localeLabel(locale)} (${locale})`}
                  <ICONS.check
                    className={`ml-auto h-4 w-4 ${locale === value ? 'opacity-100' : 'opacity-0'}`}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
