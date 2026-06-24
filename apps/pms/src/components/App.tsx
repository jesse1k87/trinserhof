import '../index.css';
import * as React from 'react';
import { Analytics } from '@vercel/analytics/react';
import { BookingContext, BookingContextType } from 'src/context/BookingContext';
import { CustomerContext, CustomerContextType } from 'src/context/CustomerContext';
import { ProductContext, ProductContextType } from 'src/context/ProductContext';
import { RoomContext, RoomContextType } from 'src/context/RoomContext';
import { TimelineContext } from 'src/context/TimelineContext';
import { BookingDetails } from './BookingDetails';
import { CustomerDetails } from './CustomerDetails';
import { ProductDetails } from './ProductDetails';
import { RoomDetails } from './RoomDetails';
import { BookingsTable } from './BookingsTable';
import { CustomersTable } from './CustomersTable';
import { ProductsTable } from './ProductsTable';
import { UsersTable } from './UsersTable';
import { RoomsTable } from './RoomsTable';
import { Calendar } from './Calendar';
import { DataMigration } from './DataMigration';
import { RawData } from './RawData';
import { AuditLog } from './AuditLog';
import {
  Button,
  Error,
  Spinner,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Toaster,
} from '@trinserhof/ui';
import {
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
  ArchiveIcon,
} from '@radix-ui/react-icons';
import { Header } from './Header';
import { getSignedInUser, logIn, logOut } from '@trinserhof/database';

import { Timeline } from 'vis-timeline/standalone';
import { LoginForm } from './LoginForm';
import { BuildFooter } from './BuildFooter';
import useTheme from 'src/hooks/useTheme';
import { type User } from '@trinserhof/types';
import { type Page } from 'src/types/page';

export const App = () => {
  const [user, setUser] = React.useState<User | null>(null);
  const [error, setError] = React.useState<'NOT_ALLOWED' | 'BLOCKED' | null>(null);
  const [theme, toggleTheme] = useTheme();

  React.useEffect(() => {
    getSignedInUser(setUser, setError);
  }, [setUser, setError]);

  const [booking, setBooking] = React.useState<BookingContextType>(null);
  const [customer, setCustomer] = React.useState<CustomerContextType>(null);
  const [product, setProduct] = React.useState<ProductContextType>(null);
  const [room, setRoom] = React.useState<RoomContextType>(null);
  const [page, setPage] = React.useState<Page>('calendar');
  const timelineRef = React.useRef<Timeline | null>(null);

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
        <DropdownMenuItem
          onClick={() => setPage('products-table')}
          className="gap-2 hover:cursor-pointer"
        >
          <ArchiveIcon />
          Products
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setPage('rooms-table')}
          className="gap-2 hover:cursor-pointer"
        >
          <HomeIcon />
          Rooms
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setPage('audit-log')}
          className="gap-2 hover:cursor-pointer"
        >
          <ActivityLogIcon />
          Audit log
        </DropdownMenuItem>
        {user.role === 'OWNER' && <DropdownMenuSeparator />}
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
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <BookingContext.Provider value={[booking, setBooking]}>
      <CustomerContext.Provider value={[customer, setCustomer]}>
        <ProductContext.Provider value={[product, setProduct]}>
          <RoomContext.Provider value={[room, setRoom]}>
            <TimelineContext.Provider value={timelineRef}>
              <Toaster position="top-center" richColors />
              <div className="flex flex-col justify-center items-center content-center">
                <Header navMenu={navMenu} userMenu={userMenu} />
                {page === 'calendar' ? (
                  <Calendar user={user} />
                ) : page === 'migration' ? (
                  <DataMigration role={user.role} />
                ) : page === 'bookings-table' ? (
                  <BookingsTable />
                ) : page === 'raw-data' ? (
                  <RawData user={user} />
                ) : page === 'users-table' ? (
                  <UsersTable user={user} />
                ) : page === 'rooms-table' ? (
                  <RoomsTable user={user} />
                ) : page === 'products-table' ? (
                  <ProductsTable user={user} />
                ) : page === 'audit-log' ? (
                  <AuditLog />
                ) : (
                  <CustomersTable user={user} />
                )}
                {booking && <BookingDetails user={user} />}
                {customer && <CustomerDetails user={user} />}
                {product && <ProductDetails user={user} />}
                {room && <RoomDetails user={user} />}
                <BuildFooter />
              </div>
              <Analytics />
            </TimelineContext.Provider>
          </RoomContext.Provider>
        </ProductContext.Provider>
      </CustomerContext.Provider>
    </BookingContext.Provider>
  );
};
