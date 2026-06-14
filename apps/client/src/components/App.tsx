import '../index.css';
import * as React from 'react';
import { BookingContext, BookingContextType } from 'src/context/BookingContext';
import { BookingDetails } from './BookingDetails';
import { Calendar } from './Calendar';
import { Button, Error, NoEditingAllowed } from '@bookings/ui';
import { getNewBooking } from '@bookings/helpers';
import { PlusIcon, ArrowLeftIcon, ArrowRightIcon, CalendarIcon } from '@radix-ui/react-icons';
import { SearchBox } from './SearchBox';
import { getSignedInUser, logIn, logOut } from '@bookings/database';
import { User } from 'firebase/auth';
import { LoginForm } from './LoginForm';

export const App = () => {
  const [user, setUser] = React.useState<User | false | null>(null);
  const [admin, setAdmin] = React.useState<boolean>(false);
  const [error, setError] = React.useState<'NOT_ALLOWED' | null>(null);

  React.useEffect(() => {
    getSignedInUser(setUser, setAdmin, setError);
  }, [setUser, setAdmin, setError]);

  const [booking, setBooking] = React.useState<BookingContextType>(null);

  if (user === null) {
    return (
      <div className="flex flex-col min-h-screen justify-center items-center content-center">
        <CalendarIcon className="animate-spin" />
      </div>
    );
  }

  if (!user || !user.email) {
    return (
      <div className="flex flex-col min-h-screen justify-center items-center content-center">
        <div className="flex flex-col gap-6">
          {error === 'NOT_ALLOWED' && <Error message="You are not allowed in." />}
          <LoginForm />
        </div>
      </div>
    );
  }

  return (
    <BookingContext.Provider value={[booking, setBooking]}>
      <div className="flex flex-col justify-center items-center content-center">
        <div className="flex flex-row w-full justify-between items-center content-center p-2">
          <div className="flex flex-row w-full gap-2 mx-1 items-center content-center justify-start">
            <Button id="prevMonth" variant="outline" className="rounded-full hover:cursor-pointer">
              <ArrowLeftIcon />
            </Button>
            <Button id="today" className="rounded-full hover:cursor-pointer">
              Today
            </Button>
            <Button id="nextMonth" variant="outline" className="rounded-full hover:cursor-pointer">
              <ArrowRightIcon />
            </Button>

            <div className="ml-2">
              {admin ? (
                <Button
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
          <div className="flex flex-row w-full mx-1 items-center content-center justify-center">
            <SearchBox />
          </div>
          <div className="flex flex-row w-full mx-1 items-center content-center justify-end gap-3">
            <div className="text-xs font-mono text-gray-400">26030215312</div>
            {user ? (
              <>
                <div className="text-xs">{user.email}</div>
                <Button
                  variant="outline"
                  onClick={() => logOut(setUser)}
                  className="p-3 rounded-full hover:cursor-pointer"
                >
                  Sign out
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                onClick={() => logIn()}
                className="p-3 rounded-full hover:cursor-pointer"
              >
                Login
              </Button>
            )}
          </div>
        </div>
        <Calendar />
        {booking && <BookingDetails user={user} isAdmin={admin} />}
      </div>
    </BookingContext.Provider>
  );
};
