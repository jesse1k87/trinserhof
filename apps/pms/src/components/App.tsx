import '../index.css';
import * as React from 'react';
import { Analytics } from '@vercel/analytics/react';
import { BookingContext, BookingContextType } from 'src/context/BookingContext';
import { TimelineContext } from 'src/context/TimelineContext';
import { BookingDetails } from './BookingDetails';
import { BookingsTable } from './BookingsTable';
import { CustomersTable } from './CustomersTable';
import { UsersTable } from './UsersTable';
import { RoomsTable } from './RoomsTable';
import { Calendar } from './Calendar';
import { DataMigration } from './DataMigration';
import { RawData } from './RawData';
import { AuditLog } from './AuditLog';
import {
  Button,
  Calendar as DatePickerCalendar,
  Error,
  NoEditingAllowed,
  Spinner,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Toaster,
} from '@trinserhof/ui';
import { getNewBooking } from '@trinserhof/helpers';
import {
  PlusIcon,
  CalendarIcon,
  SunIcon,
  MoonIcon,
  HamburgerMenuIcon,
  ListBulletIcon,
  PersonIcon,
  AvatarIcon,
  HomeIcon,
  UpdateIcon,
  FileTextIcon,
  ActivityLogIcon,
} from '@radix-ui/react-icons';
import { SearchBox } from './SearchBox';
import { getSignedInUser, logIn, logOut } from '@trinserhof/database';

import { Timeline } from 'vis-timeline/standalone';
import { LoginForm } from './LoginForm';
import { BuildFooter } from './BuildFooter';
import useTheme from 'src/hooks/useTheme';
import { type User } from '@trinserhof/types';
import { canCreateReservation } from '@trinserhof/types/src/role';

export const App = () => {
  const [user, setUser] = React.useState<User | null>(null);
  const [error, setError] = React.useState<'NOT_ALLOWED' | 'BLOCKED' | null>(null);
  const [theme, toggleTheme] = useTheme();

  React.useEffect(() => {
    getSignedInUser(setUser, setError);
  }, [setUser, setError]);

  const [booking, setBooking] = React.useState<BookingContextType>(null);
  const [page, setPage] = React.useState<
    | 'calendar'
    | 'migration'
    | 'bookings-table'
    | 'customers-table'
    | 'users-table'
    | 'rooms-table'
    | 'raw-data'
    | 'audit-log'
  >('calendar');
  const timelineRef = React.useRef<Timeline | null>(null);
  const [jumpDate, setJumpDate] = React.useState<Date | undefined>(undefined);
  const [datePickerOpen, setDatePickerOpen] = React.useState(false);

  if (user === null) {
    return (
      <div className="flex flex-col min-h-screen justify-center items-center content-center">
        <Spinner />
      </div>
    );
  }

  if (!user || !user.email) {
    return (
      <div className="relative flex flex-col h-screen overflow-hidden justify-center items-center content-center">
        <img
          src="./trinserhof-logo.svg"
          alt="Hotel Trinserhof"
          className="absolute top-8 left-1/2 h-16 -translate-x-1/2"
        />
        <div className="flex flex-col gap-6">
          {error === 'NOT_ALLOWED' && <Error message="You are not allowed in." />}
          {error === 'BLOCKED' && <Error message="Your access has been blocked." />}
          <LoginForm />
        </div>
        <div className="absolute bottom-2">
          <BuildFooter />
        </div>
      </div>
    );
  }

  const userMenu = user ? (
    <DropdownMenu>
      <DropdownMenuTrigger className="shrink-0 rounded-full hover:cursor-pointer">
        {user.image ? (
          <img
            src={user.image}
            alt={user.email}
            className="h-8 w-8 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="h-8 w-8 shrink-0 rounded-full bg-muted flex items-center justify-center text-xs">
            {user.email[0]?.toUpperCase()}
          </div>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel className="flex items-center gap-2">
          {user.image && (
            <img
              src={user.image}
              alt={user.email}
              className="h-6 w-6 shrink-0 rounded-full object-cover"
            />
          )}
          <span className="font-normal text-xs">{user.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={toggleTheme} className="gap-2 hover:cursor-pointer">
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => logOut(setUser)} className="hover:cursor-pointer">
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ) : (
    <Button
      variant="outline"
      onClick={() => logIn()}
      className="p-3 rounded-full hover:cursor-pointer"
    >
      Login
    </Button>
  );

  const navMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="icon"
          variant="outline"
          aria-label="Open navigation menu"
          className="rounded-full hover:cursor-pointer"
        >
          <HamburgerMenuIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem
          onClick={() => setPage('calendar')}
          className="gap-2 hover:cursor-pointer"
        >
          <CalendarIcon />
          Calendar
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setPage('bookings-table')}
          className="gap-2 hover:cursor-pointer"
        >
          <ListBulletIcon />
          Reservations
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setPage('customers-table')}
          className="gap-2 hover:cursor-pointer"
        >
          <PersonIcon />
          Guests
        </DropdownMenuItem>
        {user.role === 'OWNER' && (
          <DropdownMenuItem
            onClick={() => setPage('users-table')}
            className="gap-2 hover:cursor-pointer"
          >
            <AvatarIcon />
            Users
          </DropdownMenuItem>
        )}
        {user.role === 'OWNER' && (
          <DropdownMenuItem
            onClick={() => setPage('rooms-table')}
            className="gap-2 hover:cursor-pointer"
          >
            <HomeIcon />
            Rooms
          </DropdownMenuItem>
        )}
        {user.role === 'OWNER' && (
          <DropdownMenuItem
            onClick={() => setPage('migration')}
            className="gap-2 hover:cursor-pointer"
          >
            <UpdateIcon />
            Data migrations
          </DropdownMenuItem>
        )}
        {user.role === 'OWNER' && (
          <DropdownMenuItem
            onClick={() => setPage('raw-data')}
            className="gap-2 hover:cursor-pointer"
          >
            <FileTextIcon />
            Raw data
          </DropdownMenuItem>
        )}
        {user.role === 'OWNER' && (
          <DropdownMenuItem
            onClick={() => setPage('audit-log')}
            className="gap-2 hover:cursor-pointer"
          >
            <ActivityLogIcon />
            Audit log
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <BookingContext.Provider value={[booking, setBooking]}>
      <TimelineContext.Provider value={timelineRef}>
        <Toaster position="top-center" richColors />
        <div className="flex flex-col justify-center items-center content-center">
          {page === 'calendar' ? (
            <>
              <div className="flex flex-col md:flex-row w-full items-center content-center gap-2 p-2">
                <div className="flex flex-row flex-wrap w-full md:w-auto items-center content-center justify-between md:justify-start gap-2 mx-1">
                  <div className="flex flex-row gap-1 sm:gap-2 items-center content-center">
                    {navMenu}
                    <img
                      src="./trinserhof-logo.svg"
                      alt="Hotel Trinserhof"
                      className="hidden sm:block h-6 sm:h-8"
                    />
                    <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          size="icon"
                          variant="outline"
                          aria-label="Jump to date"
                          className="rounded-full hover:cursor-pointer"
                        >
                          <CalendarIcon />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <DatePickerCalendar
                          initialFocus
                          mode="single"
                          selected={jumpDate}
                          defaultMonth={jumpDate}
                          onSelect={(date: Date | undefined) => {
                            if (date) {
                              setJumpDate(date);
                              timelineRef.current?.moveTo(date);
                            }
                            setDatePickerOpen(false);
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                    <Button
                      id="today"
                      variant="outline"
                      className="rounded-full hover:cursor-pointer"
                    >
                      Today
                    </Button>
                    <div>
                      {canCreateReservation(user.role) ? (
                        <Button
                          size="icon"
                          disabled={!user}
                          onClick={() => setBooking(getNewBooking())}
                          className="rounded-full hover:cursor-pointer"
                        >
                          <PlusIcon />
                        </Button>
                      ) : (
                        <NoEditingAllowed />
                      )}
                    </div>
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
              <Calendar />
              {booking && <BookingDetails user={user} />}
            </>
          ) : page === 'migration' ? (
            <>
              <div className="flex w-full items-center justify-between gap-2 p-2">
                <div className="flex flex-row gap-1 sm:gap-2 items-center content-center">
                  {navMenu}
                  <img
                    src="./trinserhof-logo.svg"
                    alt="Hotel Trinserhof"
                    className="hidden sm:block h-6 sm:h-8"
                  />
                </div>
                <div className="ml-auto">{userMenu}</div>
              </div>
              <DataMigration role={user.role} />
            </>
          ) : page === 'bookings-table' ? (
            <>
              <div className="flex w-full items-center justify-between gap-2 p-2">
                <div className="flex flex-row gap-1 sm:gap-2 items-center content-center">
                  {navMenu}
                  <img
                    src="./trinserhof-logo.svg"
                    alt="Hotel Trinserhof"
                    className="hidden sm:block h-6 sm:h-8"
                  />
                </div>
                <div className="ml-auto">{userMenu}</div>
              </div>
              <BookingsTable />
              {booking && <BookingDetails user={user} />}
            </>
          ) : page === 'raw-data' ? (
            <>
              <div className="flex w-full items-center justify-between gap-2 p-2">
                <div className="flex flex-row gap-1 sm:gap-2 items-center content-center">
                  {navMenu}
                  <img src="./trinserhof-logo.svg" alt="Hotel Trinserhof" className="h-6 sm:h-8" />
                </div>
                <div className="ml-auto">{userMenu}</div>
              </div>
              <RawData user={user} />
            </>
          ) : page === 'users-table' ? (
            <>
              <div className="flex w-full items-center justify-between gap-2 p-2">
                <div className="flex flex-row gap-1 sm:gap-2 items-center content-center">
                  {navMenu}
                  <img
                    src="./trinserhof-logo.svg"
                    alt="Hotel Trinserhof"
                    className="hidden sm:block h-6 sm:h-8"
                  />
                </div>
                <div className="ml-auto">{userMenu}</div>
              </div>
              <UsersTable user={user} />
            </>
          ) : page === 'rooms-table' ? (
            <>
              <div className="flex w-full items-center justify-between gap-2 p-2">
                <div className="flex flex-row gap-1 sm:gap-2 items-center content-center">
                  {navMenu}
                  <img
                    src="./trinserhof-logo.svg"
                    alt="Hotel Trinserhof"
                    className="hidden sm:block h-6 sm:h-8"
                  />
                </div>
                <div className="ml-auto">{userMenu}</div>
              </div>
              <RoomsTable />
            </>
          ) : page === 'audit-log' ? (
            <>
              <div className="flex w-full items-center justify-between gap-2 p-2">
                <div className="flex flex-row gap-1 sm:gap-2 items-center content-center">
                  {navMenu}
                  <img
                    src="./trinserhof-logo.svg"
                    alt="Hotel Trinserhof"
                    className="hidden sm:block h-6 sm:h-8"
                  />
                </div>
                <div className="ml-auto">{userMenu}</div>
              </div>
              <AuditLog />
            </>
          ) : (
            <>
              <div className="flex w-full items-center justify-between gap-2 p-2">
                <div className="flex flex-row gap-1 sm:gap-2 items-center content-center">
                  {navMenu}
                  <img
                    src="./trinserhof-logo.svg"
                    alt="Hotel Trinserhof"
                    className="hidden sm:block h-6 sm:h-8"
                  />
                </div>
                <div className="ml-auto">{userMenu}</div>
              </div>
              <CustomersTable />
            </>
          )}
          <BuildFooter />
        </div>
        <Analytics />
      </TimelineContext.Provider>
    </BookingContext.Provider>
  );
};
