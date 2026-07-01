import * as React from 'react';
import { Button, ChevronLeftIcon, ChevronRightIcon } from '@trinserhof/ui';
import { type User } from '@trinserhof/types';
import { type Page } from 'src/types/page';
import { NavMenu } from './NavMenu';
import { UserMenu } from './UserMenu';

export interface SidebarProps {
  user: User;
  setUser: React.Dispatch<React.SetStateAction<User | null | undefined>>;
  navigate: (nextPage: Page, id?: string) => void;
  theme: string | undefined;
  toggleTheme: () => void;
  currentPage: Page;
}

export const Sidebar = ({
  user,
  setUser,
  navigate,
  theme,
  toggleTheme,
  currentPage,
}: SidebarProps) => {
  const [isOpen, setIsOpen] = React.useState(true);

  return (
    <aside
      className={`sticky top-0 z-30 flex h-dvh shrink-0 flex-col border-r border-base-200 transition-[width] duration-200 ${
        isOpen ? 'w-64' : 'w-16'
      }`}
    >
      <div className={`flex items-center p-2 ${isOpen ? 'justify-end' : 'justify-center'}`}>
        <Button
          className="btn-ghost"
          aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          onClick={() => setIsOpen((open) => !open)}
        >
          {isOpen ? <ChevronLeftIcon /> : <ChevronRightIcon />}
        </Button>
      </div>

      <nav className="flex-1 overflow-y-auto">
        <NavMenu user={user} navigate={navigate} isOpen={isOpen} currentPage={currentPage} />
      </nav>

      <div className={`flex flex-col gap-1 p-2 ${isOpen ? '' : 'items-center'}`}>
        <UserMenu
          user={user}
          theme={theme}
          toggleTheme={toggleTheme}
          setUser={setUser}
          navigate={navigate}
          isOpen={isOpen}
        />
      </div>
    </aside>
  );
};
