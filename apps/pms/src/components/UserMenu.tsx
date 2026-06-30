import * as React from 'react';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  ICONS,
} from '@trinserhof/ui';
import { logOut } from '@trinserhof/supabase';
import { canPerform, type User } from '@trinserhof/types';

const formatBuildTime = (isoString: string | undefined) => {
  if (!isoString) return '';
  return formatRelativeTime(new Date(isoString));
};

const formatRelativeTime = (date: Date) => {
  const diffSeconds = Math.round((date.getTime() - Date.now()) / 1000);
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 60 * 60 * 24 * 365],
    ['month', 60 * 60 * 24 * 30],
    ['week', 60 * 60 * 24 * 7],
    ['day', 60 * 60 * 24],
    ['hour', 60 * 60],
    ['minute', 60],
    ['second', 1],
  ];
  for (const [unit, secondsInUnit] of units) {
    if (Math.abs(diffSeconds) >= secondsInUnit || unit === 'second') {
      return rtf.format(Math.round(diffSeconds / secondsInUnit), unit);
    }
  }
  return rtf.format(diffSeconds, 'second');
};

export const UserMenu = ({
  user,
  theme,
  toggleTheme,
  setUser,
}: {
  user: User;
  theme: string | undefined;
  toggleTheme: () => void;
  setUser: React.Dispatch<React.SetStateAction<User | null | undefined>>;
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="ghost" aria-label="Open user menu">
          <img
            src={user.image}
            alt={user.email}
            className="h-6 w-6 shrink-0 rounded-full object-cover"
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          className="gap-2 cursor-default"
          onSelect={(event) => event.preventDefault()}
        >
          {user.image ? (
            <img
              src={user.image}
              alt={user.email}
              className="h-6 w-6 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="h-6 w-6 shrink-0 rounded-full bg-base-200 flex items-center justify-center text-xs">
              {user.email[0]?.toUpperCase()}
            </div>
          )}
          <span className="font-normal text-xs truncate">{user.email}</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={toggleTheme} className="gap-2 hover:cursor-pointer">
          {theme === 'dark' ? <ICONS.themeLight /> : <ICONS.themeDark />}
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => logOut(setUser)} className="hover:cursor-pointer">
          Sign out
        </DropdownMenuItem>

        {canPerform(user.role, 'USER', 'READ') && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <div className="flex-col flex text-xs font-mono text-base-content/60">
                <div>{formatBuildTime(process.env.BUILD_TIME)}</div>
                <div>{process.env.BUILD_VERSION}</div>
              </div>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
