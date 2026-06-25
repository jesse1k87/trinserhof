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
import { TableContext, TableContextType } from 'src/context/TableContext';
import {
  TableReservationContext,
  TableReservationContextType,
} from 'src/context/TableReservationContext';
import { TimelineContext } from 'src/context/TimelineContext';
import { BookingDetails } from './BookingDetails';
import { CustomerDetails } from './CustomerDetails';
import { ProductDetails } from './ProductDetails';
import { AccountingCategoryDetails } from './AccountingCategoryDetails';
import { RoomDetails } from './RoomDetails';
import { TableDetails } from './TableDetails';
import { TableReservationDetails } from './TableReservationDetails';
import { BookingsTable } from './BookingsTable';
import { CustomersTable } from './CustomersTable';
import { ProductsTable } from './ProductsTable';
import { UsersTable } from './UsersTable';
import { RoomsTable } from './RoomsTable';
import { TablesTable } from './TablesTable';
import { TableReservationsTable } from './TableReservationsTable';
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
  Calendar as CalendarIcon,
  Sun as SunIcon,
  Moon as MoonIcon,
  Menu as HamburgerMenuIcon,
  BedDouble as BedIcon,
  User as PersonIcon,
  CircleUserRound as AvatarIcon,
  House as HomeIcon,
  RefreshCw as UpdateIcon,
  FileText as FileTextIcon,
  ScrollText as ActivityLogIcon,
  Archive as ArchiveIcon,
  Bookmark as BookmarkIcon,
  Table2 as TableIcon,
  UtensilsCrossed as UtensilsCrossedIcon,
} from 'lucide-react';
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
  const [table, setTable] = React.useState<TableContextType>(null);
  const [tableReservation, setTableReservation] = React.useState<TableReservationContextType>(null);
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

  const canReadBookings = canPerform(user.role, 'BOOKING', 'READ');
  const canReadCustomers = canPerform(user.role, 'CUSTOMER', 'READ');
  const canReadProducts = canPerform(user.role, 'PRODUCT', 'READ');
  const canReadRooms = canPerform(user.role, 'ROOM', 'READ');
  const canReadTables = canPerform(user.role, 'TABLE', 'READ');
  const canReadTableReservations = canPerform(user.role, 'TABLE_RESERVATION', 'READ');
  const canReadAccountingCategories = canPerform(user.role, 'ACCOUNTING_CATEGORY', 'READ');
  const canReadAuditLog = canPerform(user.role, 'AUDIT_LOG', 'READ');
  const canReadUsers = canPerform(user.role, 'USER', 'READ');
  const canReadMigrations = canPerform(user.role, 'USER', 'READ');
  const canReadRawData = canPerform(user.role, 'RAW_DATA', 'READ');

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
        {canReadBookings && (
          <DropdownMenuItem
            onClick={() => navigate('calendar')}
            className={navItemClassName('calendar')}
          >
            <CalendarIcon />
            Calendar
          </DropdownMenuItem>
        )}
        {canReadBookings && (
          <DropdownMenuItem
            onClick={() => navigate('bookings-table')}
            className={navItemClassName('bookings-table')}
          >
            <BedIcon />
            Bookings
          </DropdownMenuItem>
        )}
        {canReadTableReservations && (
          <DropdownMenuItem
            onClick={() => navigate('table-reservations-table')}
            className={navItemClassName('table-reservations-table')}
          >
            <UtensilsCrossedIcon />
            Table reservations
          </DropdownMenuItem>
        )}
        {canReadCustomers && (
          <DropdownMenuItem
            onClick={() => navigate('customers-table')}
            className={navItemClassName('customers-table')}
          >
            <PersonIcon />
            Customers
          </DropdownMenuItem>
        )}

        {canReadRooms && (
          <DropdownMenuItem
            onClick={() => navigate('rooms-table')}
            className={navItemClassName('rooms-table')}
          >
            <HomeIcon />
            Rooms
          </DropdownMenuItem>
        )}
        {canReadTables && (
          <DropdownMenuItem
            onClick={() => navigate('tables-table')}
            className={navItemClassName('tables-table')}
          >
            <TableIcon />
            Tables
          </DropdownMenuItem>
        )}
        {canReadProducts && (
          <DropdownMenuItem
            onClick={() => navigate('products-table')}
            className={navItemClassName('products-table')}
          >
            <ArchiveIcon />
            Products
          </DropdownMenuItem>
        )}
        {canReadAccountingCategories && (
          <DropdownMenuItem
            onClick={() => navigate('accounting-categories-table')}
            className={navItemClassName('accounting-categories-table')}
          >
            <BookmarkIcon />
            Accounting categories
          </DropdownMenuItem>
        )}

        {(canReadAuditLog || canReadAccountingCategories || canReadUsers) && (
          <DropdownMenuSeparator />
        )}

        {canReadAuditLog && (
          <DropdownMenuItem
            onClick={() => navigate('audit-log')}
            className={navItemClassName('audit-log')}
          >
            <ActivityLogIcon />
            Audit log
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
        {canReadMigrations && (
          <DropdownMenuItem
            onClick={() => navigate('migration')}
            className={navItemClassName('migration')}
          >
            <UpdateIcon />
            Data migrations
          </DropdownMenuItem>
        )}
        {canReadRawData && (
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
      {canReadBookings && (
        <Button
          size="icon"
          variant="ghost"
          aria-label="Calendar"
          title="Calendar"
          className={cn(page === 'calendar' && 'bg-base-200')}
          onClick={() => navigate('calendar')}
        >
          <CalendarIcon />
        </Button>
      )}
      {canReadBookings && (
        <Button
          size="icon"
          variant="ghost"
          aria-label="Bookings"
          title="Bookings"
          className={cn(page === 'bookings-table' && 'bg-base-200')}
          onClick={() => navigate('bookings-table')}
        >
          <BedIcon />
        </Button>
      )}
      {canReadTableReservations && (
        <Button
          size="icon"
          variant="ghost"
          aria-label="Table reservations"
          title="Table reservations"
          className={cn(page === 'table-reservations-table' && 'bg-base-200')}
          onClick={() => navigate('table-reservations-table')}
        >
          <UtensilsCrossedIcon />
        </Button>
      )}
    </div>
  );

  return (
    <BookingContext.Provider value={[booking, setBooking]}>
      <CustomerContext.Provider value={[customer, setCustomer]}>
        <ProductContext.Provider value={[product, setProduct]}>
          <AccountingCategoryContext.Provider value={[accountingCategory, setAccountingCategory]}>
            <RoomContext.Provider value={[room, setRoom]}>
              <TableContext.Provider value={[table, setTable]}>
                <TableReservationContext.Provider value={[tableReservation, setTableReservation]}>
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
                      ) : page === 'tables-table' ? (
                        <TablesTable user={user} />
                      ) : page === 'table-reservations-table' ? (
                        <TableReservationsTable user={user} />
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
                      {table && <TableDetails user={user} />}
                      {tableReservation && <TableReservationDetails user={user} />}
                      <BuildFooter />
                    </div>
                    <Analytics />
                  </TimelineContext.Provider>
                </TableReservationContext.Provider>
              </TableContext.Provider>
            </RoomContext.Provider>
          </AccountingCategoryContext.Provider>
        </ProductContext.Provider>
      </CustomerContext.Provider>
    </BookingContext.Provider>
  );
};
