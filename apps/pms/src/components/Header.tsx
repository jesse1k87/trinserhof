import * as React from 'react';
import { SearchBox } from './SearchBox';

type HeaderProps = {
  navMenu: React.ReactNode;
};

export const Header = ({ navMenu }: HeaderProps) => (
  <div className="sticky top-0 z-30 flex flex-row w-full items-center content-center gap-2 p-2 bg-background border-b">
    <div className="flex flex-row gap-1 sm:gap-2 items-center content-center shrink-0 mx-1">
      {navMenu}
      <img
        src="./trinserhof-logo.svg"
        alt="Hotel Trinserhof"
        className="hidden sm:block h-6 sm:h-8"
      />
    </div>
    <div className="flex flex-1 min-w-0 items-center content-center justify-center mx-1">
      <SearchBox />
    </div>
  </div>
);
