import * as React from 'react';
import { SignOutIcon, ThemeDarkIcon, ThemeLightIcon, UserIcon } from '@trinserhof/ui';
import { logOut } from '@trinserhof/supabase';
import { canPerform, type User } from '@trinserhof/types';
import { type Page } from 'src/types/page';

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
  navigate,
  isOpen,
}: {
  user: User;
  theme: string | undefined;
  toggleTheme: () => void;
  setUser: React.Dispatch<React.SetStateAction<User | null | undefined>>;
  navigate: (page: Page, id?: string) => void;
  isOpen: boolean;
}) => {
  return (
    <ul className="menu w-full p-0">
      <li>
        <div
          className={`gap-2 cursor-default pointer-events-none ${isOpen ? '' : 'justify-center'}`}
          title={isOpen ? undefined : user.email}
          aria-label={user.email}
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
          {isOpen && <span className="truncate">{user.email}</span>}
        </div>
      </li>

      <li>
        <a
          onClick={() => navigate('user-detail', user.id)}
          title={isOpen ? undefined : 'Preferences'}
          aria-label="Preferences"
          className={isOpen ? undefined : 'justify-center'}
        >
          <UserIcon />
          {isOpen && 'Preferences'}
        </a>
      </li>

      <li>
        <a
          onClick={toggleTheme}
          title={isOpen ? undefined : theme === 'dark' ? 'Light mode' : 'Dark mode'}
          aria-label={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          className={isOpen ? undefined : 'justify-center'}
        >
          {theme === 'dark' ? <ThemeLightIcon /> : <ThemeDarkIcon />}
          {isOpen && (theme === 'dark' ? 'Light mode' : 'Dark mode')}
        </a>
      </li>

      <li>
        <a
          onClick={() => logOut(setUser)}
          title={isOpen ? undefined : 'Sign out'}
          aria-label="Sign out"
          className={isOpen ? undefined : 'justify-center'}
        >
          <SignOutIcon />
          {isOpen && 'Sign out'}
        </a>
      </li>

      {canPerform(user.role, 'USER', 'READ') && isOpen && (
        <li className="text-xs font-mono">
          <div className="mt-2">
            {formatBuildTime(process.env.BUILD_TIME)}
            <br />
            {process.env.BUILD_VERSION}
          </div>
        </li>
      )}
    </ul>
  );
};
