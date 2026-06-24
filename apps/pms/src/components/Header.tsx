import * as React from 'react';
import { MagnifyingGlassIcon } from '@radix-ui/react-icons';

import { Button } from '@trinserhof/ui';
import { SearchBox } from './SearchBox';

type HeaderProps = {
  navMenu: React.ReactNode;
  shortcuts?: React.ReactNode;
};

export const Header = ({ navMenu, shortcuts }: HeaderProps) => {
  const [searchOpen, setSearchOpen] = React.useState(false);

  return (
    <div className="sticky top-0 z-30 flex flex-row w-full items-center content-center gap-2 p-2 bg-background border-b">
      <div className="flex flex-row gap-1 sm:gap-2 items-center content-center shrink-0 mx-1">
        {navMenu}
        {shortcuts}
      </div>
      <div className="flex flex-1 min-w-0 items-center content-center justify-end mx-1">
        {searchOpen ? (
          <SearchBox autoOpen onOpenChange={(open) => setSearchOpen(open)} />
        ) : (
          <Button
            variant="ghost"
            size="icon"
            aria-label="Search"
            onClick={() => setSearchOpen(true)}
          >
            <MagnifyingGlassIcon className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};
