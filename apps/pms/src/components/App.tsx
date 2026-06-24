import '../index.css';
import * as React from 'react';
import { Analytics } from '@vercel/analytics/react';
import { BookingContext, BookingContextType } from 'src/context/BookingContext';
import { CustomerContext, CustomerContextType } from 'src/context/CustomerContext';
import { ProductContext, ProductContextType } from 'src/context/ProductContext';
import {
  ProductCategoryContext,
  ProductCategoryContextType,
} from 'src/context/ProductCategoryContext';
import { RoomContext, RoomContextType } from 'src/context/RoomContext';
import { TimelineContext } from 'src/context/TimelineContext';
import { BookingDetails } from './BookingDetails';
import { CustomerDetails } from './CustomerDetails';
import { ProductDetails } from './ProductDetails';
import { ProductCategoryDetails } from './ProductCategoryDetails';
import { RoomDetails } from './RoomDetails';
import { BookingsTable } from './BookingsTable';
import { CustomersTable } from './CustomersTable';
import { ProductsTable } from './ProductsTable';
import { ProductCategoriesTable } from './ProductCategoriesTable';
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
  BookmarkIcon,
} from '@radix-ui/react-icons';
import { Header } from './Header';
import { getSignedInUser, logOut } from '@trinserhof/database';

import { Timeline } from 'vis-timeline/standalone';
import { LoginForm } from './LoginForm';
import { BuildFooter } from './BuildFooter';
import useTheme from 'src/hooks/useTheme';
import { type User } from '@trinserhof/types';
import { type Page } from 'src/types/page';
import { getPagePath, getPageFromPath } from 'src/helpers/pageRoutes';

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
  const [productCategory, setProductCategory] = React.useState<ProductCategoryContextType>(null);
  const [room, setRoom] = React.useState<RoomContextType>(null);
  const [page, setPage] = React.useState<Page>(() => getPageFromPath(window.location.pathname));
  const timelineRef = React.useRef<Timeline | null>(null);

  const navigate = React.useCallback((nextPage: Page) => {
    setPage(nextPage);
    const path = getPagePath(nextPage);
    if (window.location.pathname !== path) {
      window.history.pushState(null, '', path);
    }
  }, []);

  React.useEffect(() => {
    const expectedPath = getPagePath(page);
    if (window.location.pathname !== expectedPath) {
      window.history.replaceState(null, '', expectedPath);
    }

    const onPopState = () => setPage(getPageFromPath(window.location.pathname));
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const navMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          aria-label="Open navigation menu"
          className="rounded-full hover:cursor-pointer"
        >
          <HamburgerMenuIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem
          onClick={() => navigate('calendar')}
          className="gap-2 hover:cursor-pointer"
        >
          <CalendarIcon />
          Calendar
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => navigate('bookings-table')}
          className="gap-2 hover:cursor-pointer"
        >
          <ListBulletIcon />
          Reservations
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => navigate('customers-table')}
          className="gap-2 hover:cursor-pointer"
        >
          <PersonIcon />
          Guests
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => navigate('products-table')}
          className="gap-2 hover:cursor-pointer"
        >
          <ArchiveIcon />
          Products
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => navigate('rooms-table')}
          className="gap-2 hover:cursor-pointer"
        >
          <HomeIcon />
          Rooms
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => navigate('audit-log')}
          className="gap-2 hover:cursor-pointer"
        >
          <ActivityLogIcon />
          Audit log
        </DropdownMenuItem>
        {user.role === 'OWNER' && <DropdownMenuSeparator />}
        {user.role === 'OWNER' && (
          <DropdownMenuItem
            onClick={() => navigate('product-categories-table')}
            className="gap-2 hover:cursor-pointer"
          >
            <BookmarkIcon />
            Product categories
          </DropdownMenuItem>
        )}
        {user.role === 'OWNER' && (
          <DropdownMenuItem
            onClick={() => navigate('users-table')}
            className="gap-2 hover:cursor-pointer"
          >
            <AvatarIcon />
            Users
          </DropdownMenuItem>
        )}
        {user.role === 'OWNER' && (
          <DropdownMenuItem
            onClick={() => navigate('migration')}
            className="gap-2 hover:cursor-pointer"
          >
            <UpdateIcon />
            Data migrations
          </DropdownMenuItem>
        )}
        {user.role === 'OWNER' && (
          <DropdownMenuItem
            onClick={() => navigate('raw-data')}
            className="gap-2 hover:cursor-pointer"
          >
            <FileTextIcon />
            Raw data
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="gap-2 cursor-default"
          onSelect={(event) => event.preventDefault()}
        >
          {user.image ? (
            <img
              src={user.image}
              alt={user.email}
              className="h-6 w-6 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="h-6 w-6 shrink-0 rounded-full bg-muted flex items-center justify-center text-xs">
              {user.email[0]?.toUpperCase()}
            </div>
          )}
          <span className="font-normal text-xs truncate">{user.email}</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={toggleTheme} className="gap-2 hover:cursor-pointer">
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => logOut(setUser)} className="hover:cursor-pointer">
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <BookingContext.Provider value={[booking, setBooking]}>
      <CustomerContext.Provider value={[customer, setCustomer]}>
        <ProductContext.Provider value={[product, setProduct]}>
          <ProductCategoryContext.Provider value={[productCategory, setProductCategory]}>
            <RoomContext.Provider value={[room, setRoom]}>
              <TimelineContext.Provider value={timelineRef}>
                <Toaster position="top-center" richColors />
                <div className="flex flex-col justify-center items-center content-center">
                  <Header navMenu={navMenu} />
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
                  ) : page === 'product-categories-table' ? (
                    <ProductCategoriesTable user={user} />
                  ) : page === 'audit-log' ? (
                    <AuditLog />
                  ) : (
                    <CustomersTable user={user} />
                  )}
                  {booking && <BookingDetails user={user} />}
                  {customer && <CustomerDetails user={user} />}
                  {product && <ProductDetails user={user} />}
                  {productCategory && <ProductCategoryDetails user={user} />}
                  {room && <RoomDetails user={user} />}
                  <BuildFooter />
                </div>
                <Analytics />
              </TimelineContext.Provider>
            </RoomContext.Provider>
          </ProductCategoryContext.Provider>
        </ProductContext.Provider>
      </CustomerContext.Provider>
    </BookingContext.Provider>
  );
};
