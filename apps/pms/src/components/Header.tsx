import * as React from 'react';

import { SearchBox } from './SearchBox';

export const Header = ({
  navMenu,
  shortcuts,
}: {
  navMenu: React.ReactNode;
  shortcuts: React.ReactNode;
}) => {
  return (
    <div className="sticky top-0 z-30 flex flex-row w-full items-center content-center gap-2 p-2 bg-background border-b">
      <div className="flex flex-row gap-1 sm:gap-2 items-center content-center shrink-0 mx-1">
        {navMenu}
        {shortcuts}
        <SearchBox />
      </div>
      <div className="flex flex-1 min-w-0" />
    </div>
  );
};
