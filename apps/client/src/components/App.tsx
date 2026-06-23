import '../index.css';
import * as React from 'react';
import { Analytics } from '@vercel/analytics/react';
import { BookingContext, BookingContextType } from 'src/context/BookingContext';
import { TimelineContext } from 'src/context/TimelineContext';
import { BookingDetails } from './BookingDetails';
import { BookingsTable } from './BookingsTable';
import { CustomersTable } from './CustomersTable';
import { Calendar } from './Calendar';
import { DataMigration } from './DataMigration';
import {
  Button,
  Error,
  NoEditingAllowed,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Toaster,
} from '@trinserhof/ui';
import { getNewBooking } from '@trinserhof/helpers';
import {
  PlusIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  CalendarIcon,
  SunIcon,
  MoonIcon,
} from '@radix-ui/react-icons';
import { SearchBox } from './SearchBox';
import { getSignedInUser, logIn, logOut } from '@trinserhof/database';
import { User } from 'firebase/auth';
import { Timeline } from 'vis-timeline/standalone';
import { LoginForm } from './LoginForm';
import { BuildFooter } from './BuildFooter';
import useTheme from 'src/hooks/useTheme';

export const App = () => {
  const [user, setUser] = React.useState<User | false | null>(null);
  const [admin, setAdmin] = React.useState<boolean>(false);
  const [error, setError] = React.useState<'NOT_ALLOWED' | null>(null);
  const [theme, toggleTheme] = useTheme();

  React.useEffect(() => {
    getSignedInUser(setUser, setAdmin, setError);
  }, [setUser, setAdmin, setError]);

  const [booking, setBooking] = React.useState<BookingContextType>(null);
  const [page, setPage] = React.useState<
    'calendar' | 'migration' | 'bookings-table' | 'customers-table'
  >('calendar');
  const timelineRef = React.useRef<Timeline | null>(null);

  if (user === null) {
    return (
      <div className="flex flex-col min-h-screen justify-center items-center content-center">
        <CalendarIcon className="animate-spin" />
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
        {user.photoURL ? (
          <img
            src={user.photoURL}
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
          {user.photoURL && (
            <img
              src={user.photoURL}
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
        {admin && (
          <DropdownMenuItem
            onClick={() => setPage('bookings-table')}
            className="hover:cursor-pointer"
          >
            All Bookings
          </DropdownMenuItem>
        )}
        {admin && (
          <DropdownMenuItem
            onClick={() => setPage('customers-table')}
            className="hover:cursor-pointer"
          >
            All Customers
          </DropdownMenuItem>
        )}
        {admin && (
          <DropdownMenuItem onClick={() => setPage('migration')} className="hover:cursor-pointer">
            Data Migration
          </DropdownMenuItem>
        )}
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
                    <img
                      src="./trinserhof-logo.svg"
                      alt="Hotel Trinserhof"
                      className="hidden sm:block h-6 sm:h-8"
                    />
                    <div>
                      {admin ? (
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
                    <Button
                      id="prevMonth"
                      size="icon"
                      variant="outline"
                      className="rounded-full hover:cursor-pointer"
                    >
                      <ArrowLeftIcon />
                    </Button>
                    <Button
                      id="today"
                      variant="outline"
                      className="rounded-full hover:cursor-pointer"
                    >
                      Today
                    </Button>
                    <Button
                      id="nextMonth"
                      size="icon"
                      variant="outline"
                      className="rounded-full hover:cursor-pointer"
                    >
                      <ArrowRightIcon />
                    </Button>
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
              {booking && <BookingDetails user={user} isAdmin={admin} />}
            </>
          ) : page === 'migration' ? (
            <>
              <div className="flex w-full items-center justify-between gap-2 p-2">
                <img
                  src="./trinserhof-logo.svg"
                  alt="Hotel Trinserhof"
                  className="hidden sm:block h-6 sm:h-8"
                />
                {userMenu}
              </div>
              <DataMigration isAdmin={admin} onBack={() => setPage('calendar')} />
            </>
          ) : page === 'bookings-table' ? (
            <>
              <div className="flex w-full items-center justify-between gap-2 p-2">
                <img
                  src="./trinserhof-logo.svg"
                  alt="Hotel Trinserhof"
                  className="hidden sm:block h-6 sm:h-8"
                />
                {userMenu}
              </div>
              <BookingsTable onBack={() => setPage('calendar')} />
            </>
          ) : (
            <>
              <div className="flex w-full items-center justify-between gap-2 p-2">
                <img
                  src="./trinserhof-logo.svg"
                  alt="Hotel Trinserhof"
                  className="hidden sm:block h-6 sm:h-8"
                />
                {userMenu}
              </div>
              <CustomersTable onBack={() => setPage('calendar')} />
            </>
          )}
          <BuildFooter />
        </div>
        <Analytics />
      </TimelineContext.Provider>
    </BookingContext.Provider>
  );
};
