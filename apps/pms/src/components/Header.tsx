import * as React from 'react';
import { SearchBox } from './SearchBox';

type HeaderProps = {
  navMenu: React.ReactNode;
  userMenu: React.ReactNode;
};

export const Header = ({ navMenu, userMenu }: HeaderProps) => (
  <div className="flex flex-col md:flex-row w-full items-center content-center gap-2 p-2">
    <div className="flex flex-row flex-wrap w-full md:w-auto items-center content-center justify-between md:justify-start gap-2 mx-1">
      <div className="flex flex-row gap-1 sm:gap-2 items-center content-center">
        {navMenu}
        <img
          src="./trinserhof-logo.svg"
          alt="Hotel Trinserhof"
          className="hidden sm:block h-6 sm:h-8"
        />
      </div>
      <div className="flex md:hidden items-center content-center gap-3">{userMenu}</div>
    </div>
    <div className="flex flex-row w-full md:flex-1 mx-1 items-center content-center justify-center">
      <SearchBox />
    </div>
    <div className="hidden md:flex flex-row mx-1 items-center content-center justify-end gap-3">
      {userMenu}
    </div>
  </div>
);
