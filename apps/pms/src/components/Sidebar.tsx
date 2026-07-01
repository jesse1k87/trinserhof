import { NavMenu } from "./NavMenu";
import { SearchBox } from "./SearchBox";
import { UserMenu } from "./UserMenu";

export const Sidebar = ({user,setUser,navigate,theme,toggleTheme}:{ FIX THE TYPES HERE }) => (
  <div className="sticky top-0 z-30 flex flex-row w-full items-center content-center gap-2 p-2">
    <NavMenu user={user} navigate={navigate} />
    <div className="flex flex-row gap-1 sm:gap-2 items-center content-center shrink-0 mx-1">
      <SearchBox user={user} navigate={navigate} />
    </div>
    <div className="flex flex-1 min-w-0 justify-end items-end">
      <UserMenu
        user={user}
        theme={theme}
        toggleTheme={toggleTheme}
        setUser={setUser}
        navigate={navigate}
      />
    </div>
  </div>
);
