import '../index.css';
import * as React from 'react';
import { BookingContext, BookingContextType } from 'src/context/BookingContext';
import { BookingDetails } from './BookingDetails';
import { Calendar } from './Calendar';
import { Button } from '@bookings/ui';
import { getNewBooking } from '@bookings/helpers';
import { PlusIcon } from '@radix-ui/react-icons';
import { getCurrentUser, logIn, logOut } from 'src/firebase';
import { SearchBox } from './SearchBox';

export const App = () => {
  const [isAdmin, setIsAdmin] = React.useState<boolean>(false);
  React.useEffect(() => {
    getCurrentUser(setIsAdmin);
  }, [setIsAdmin]);

  const [booking, setBooking] = React.useState<BookingContextType>(null);

  return (
    <BookingContext.Provider value={[booking, setBooking]}>
      <div className="flex flex-col justify-center items-center content-center">
        <div className="flex flex-row w-full justify-between items-center content-center p-2">
          <div className="flex flex-row w-full mx-1 items-center content-center justify-start">
            <Button id="today" className="rounded-full hover:cursor-pointer">
              Today
            </Button>
            {isAdmin && (
              <Button
                disabled={!isAdmin}
                variant="outline"
                onClick={() => setBooking(getNewBooking())}
                className="ml-2 rounded-full hover:cursor-pointer"
              >
                <PlusIcon />
              </Button>
            )}
          </div>
          <div className="flex flex-row w-full mx-1 items-center content-center justify-center">
            <SearchBox />
          </div>
          <div className="flex flex-row w-full mx-1 items-center content-center justify-end">
            {isAdmin ? (
              <Button
                variant="outline"
                onClick={() => logOut(setIsAdmin)}
                className="p-3 rounded-full hover:cursor-pointer"
              >
                Sign out
              </Button>
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
        {booking && <BookingDetails isAdmin={isAdmin} />}
      </div>
    </BookingContext.Provider>
  );
};
