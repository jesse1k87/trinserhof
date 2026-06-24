import '../index.css';
import * as React from 'react';
import { Analytics } from '@vercel/analytics/react';
import { BookingContext, BookingContextType } from 'src/context/BookingContext';
import { CustomerContext, CustomerContextType } from 'src/context/CustomerContext';
import { ProductContext, ProductContextType } from 'src/context/ProductContext';
import {
  AccountingCategoryContext,
  AccountingCategoryContextType,
} from 'src/context/AccountingCategoryContext';
import { RoomContext, RoomContextType } from 'src/context/RoomContext';
import { TimelineContext } from 'src/context/TimelineContext';
import { BookingDetails } from './BookingDetails';
import { CustomerDetails } from './CustomerDetails';
import { ProductDetails } from './ProductDetails';
import { AccountingCategoryDetails } from './AccountingCategoryDetails';
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Toaster,
  cn,
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
import { getSignedInUser, logOut, setUserTheme } from '@trinserhof/database';

import { Timeline } from 'vis-timeline/standalone';
import { LoginForm } from './LoginForm';
import { BuildFooter } from './BuildFooter';
import useTheme from 'src/hooks/useTheme';
import { canPerform, type User } from '@trinserhof/types';
import { type Page } from 'src/types/page';
import { getPagePath, getPageFromPath } from 'src/helpers/pageRoutes';
import { AccountingCategoriesTable } from './AccountingCategoriesTable';

export const App = () => {
  const [user, setUser] = React.useState<User | null | undefined>(undefined);
  const [error, setError] = React.useState<'NOT_ALLOWED' | 'BLOCKED' | null>(null);
  const [theme, setTheme] = useTheme(user?.theme);

  React.useEffect(() => {
    getSignedInUser(setUser, setError);
  }, [setUser, setError]);

  const toggleTheme = React.useCallback(() => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    if (user) {
      setUser({ ...user, theme: nextTheme });
      setUserTheme(user.id, nextTheme);
    }
  }, [theme, setTheme, user]);

  const [booking, setBooking] = React.useState<BookingContextType>(null);
  const [customer, setCustomer] = React.useState<CustomerContextType>(null);
  const [product, setProduct] = React.useState<ProductContextType>(null);
  const [accountingCategory, setAccountingCategory] =
    React.useState<AccountingCategoryContextType>(null);
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

  if (user === undefined) {
    return (
      <div className="flex flex-col min-h-dvh justify-center items-center content-center">
        <Spinner />
      </div>
    );
  }

  if (!user || !user.email) {
    return (
      <div className="relative flex flex-col h-dvh overflow-hidden justify-center items-center content-center">
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

  const navItemClassName = (itemPage: Page) =>
    cn('gap-2 hover:cursor-pointer', page === itemPage && 'bg-base-200 font-medium');

  const canReadAccountingCategories = canPerform(user.role, 'ACCOUNTING_CATEGORY', 'READ');
  const canReadUsers = canPerform(user.role, 'USER', 'READ');
  const isOwner = user.role === 'OWNER';

  const navMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          aria-label="Open navigation menu"
          className="rounded-full hover:cursor-pointer hover:bg-transparent"
        >
          <HamburgerMenuIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem
          onClick={() => navigate('calendar')}
          className={navItemClassName('calendar')}
        >
          <CalendarIcon />
          Calendar
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => navigate('bookings-table')}
          className={navItemClassName('bookings-table')}
        >
          <ListBulletIcon />
          Bookings
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => navigate('customers-table')}
          className={navItemClassName('customers-table')}
        >
          <PersonIcon />
          Customers
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => navigate('products-table')}
          className={navItemClassName('products-table')}
        >
          <ArchiveIcon />
          Products
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => navigate('rooms-table')}
          className={navItemClassName('rooms-table')}
        >
          <HomeIcon />
          Rooms
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => navigate('audit-log')}
          className={navItemClassName('audit-log')}
        >
          <ActivityLogIcon />
          Audit log
        </DropdownMenuItem>
        {(canReadAccountingCategories || canReadUsers || isOwner) && <DropdownMenuSeparator />}
        {canReadAccountingCategories && (
          <DropdownMenuItem
            onClick={() => navigate('accounting-categories-table')}
            className={navItemClassName('accounting-categories-table')}
          >
            <BookmarkIcon />
            Accounting categories
          </DropdownMenuItem>
        )}
        {canReadUsers && (
          <DropdownMenuItem
            onClick={() => navigate('users-table')}
            className={navItemClassName('users-table')}
          >
            <AvatarIcon />
            Users
          </DropdownMenuItem>
        )}
        {isOwner && (
          <DropdownMenuItem
            onClick={() => navigate('migration')}
            className={navItemClassName('migration')}
          >
            <UpdateIcon />
            Data migrations
          </DropdownMenuItem>
        )}
        {isOwner && (
          <DropdownMenuItem
            onClick={() => navigate('raw-data')}
            className={navItemClassName('raw-data')}
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

  const shortcuts = (
    <div className="flex flex-row gap-1 sm:gap-2 items-center content-center">
      <Button
        size="icon"
        variant="ghost"
        aria-label="Calendar"
        title="Calendar"
        className={cn(
          'rounded-full border hover:cursor-pointer',
          page === 'calendar' && 'bg-base-200',
        )}
        onClick={() => navigate('calendar')}
      >
        <CalendarIcon />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        aria-label="Bookings"
        title="Bookings"
        className={cn(
          'rounded-full border hover:cursor-pointer',
          page === 'bookings-table' && 'bg-base-200',
        )}
        onClick={() => navigate('bookings-table')}
      >
        <ListBulletIcon />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        aria-label="Customers"
        title="Customers"
        className={cn(
          'rounded-full border hover:cursor-pointer',
          page === 'customers-table' && 'bg-base-200',
        )}
        onClick={() => navigate('customers-table')}
      >
        <PersonIcon />
      </Button>
    </div>
  );

  return (
    <BookingContext.Provider value={[booking, setBooking]}>
      <CustomerContext.Provider value={[customer, setCustomer]}>
        <ProductContext.Provider value={[product, setProduct]}>
          <AccountingCategoryContext.Provider value={[accountingCategory, setAccountingCategory]}>
            <RoomContext.Provider value={[room, setRoom]}>
              <TimelineContext.Provider value={timelineRef}>
                <Toaster position="top-center" richColors />
                <div className="flex flex-col justify-center items-center content-center">
                  <Header navMenu={navMenu} shortcuts={shortcuts} />
                  {page === 'calendar' ? (
                    <Calendar user={user} />
                  ) : page === 'migration' ? (
                    <DataMigration role={user.role} />
                  ) : page === 'bookings-table' ? (
                    <BookingsTable user={user} />
                  ) : page === 'raw-data' ? (
                    <RawData user={user} />
                  ) : page === 'users-table' ? (
                    <UsersTable user={user} />
                  ) : page === 'rooms-table' ? (
                    <RoomsTable user={user} />
                  ) : page === 'products-table' ? (
                    <ProductsTable user={user} />
                  ) : page === 'accounting-categories-table' ? (
                    <AccountingCategoriesTable user={user} />
                  ) : page === 'audit-log' ? (
                    <AuditLog />
                  ) : (
                    <CustomersTable user={user} />
                  )}
                  {booking && <BookingDetails user={user} />}
                  {customer && <CustomerDetails user={user} />}
                  {product && <ProductDetails user={user} />}
                  {accountingCategory && <AccountingCategoryDetails user={user} />}
                  {room && <RoomDetails user={user} />}
                  <BuildFooter />
                </div>
                <Analytics />
              </TimelineContext.Provider>
            </RoomContext.Provider>
          </AccountingCategoryContext.Provider>
        </ProductContext.Provider>
      </CustomerContext.Provider>
    </BookingContext.Provider>
  );
};
