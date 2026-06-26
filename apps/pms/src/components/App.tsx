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
import { BookingCreatePage } from './BookingCreatePage';
import { BookingDetailPage } from './BookingDetailPage';
import { CustomerDetails } from './CustomerDetails';
import { ProductDetails } from './ProductDetails';
import { AccountingCategoryDetails } from './AccountingCategoryDetails';
import { RoomDetails } from './RoomDetails';
import { TableDetails } from './TableDetails';
import { TableReservationDetails } from './TableReservationDetails';
import { BookingsTable } from './BookingsTable';
import { CustomersTable } from './CustomersTable';
import { CustomerHeatmap } from './CustomerHeatmap';
import { ProductsTable } from './ProductsTable';
import { UsersTable } from './UsersTable';
import { RoomsTable } from './RoomsTable';
import { PricesTable } from './PricesTable';
import { TablesTable } from './TablesTable';
import { TableReservationsTable } from './TableReservationsTable';
import { Calendar } from './Calendar';
import { DataMigration } from './DataMigration';
import { RawData } from './RawData';
import { AuditLog } from './AuditLog';
import { Button, Error, Spinner, Toaster, cn } from '@trinserhof/ui';
import {
  Calendar as CalendarIcon,
  BedDouble as BedIcon,
  Utensils as UtensilsIcon,
} from 'lucide-react';
import { getSignedInUser, setUserTheme } from '@trinserhof/database';

import { Timeline } from 'vis-timeline/standalone';
import { LoginForm } from './LoginForm';
import { BuildFooter } from './BuildFooter';
import useTheme from 'src/hooks/useTheme';
import { canPerform, type User } from '@trinserhof/types';
import { type Page } from 'src/types/page';
import { getPagePath, getPageAndIdFromPath } from 'src/helpers/pageRoutes';
import { AccountingCategoriesTable } from './AccountingCategoriesTable';
import { SearchBox } from './SearchBox';
import { NavMenu } from './NavMenu';

export const App = () => {
  const [user, setUser] = React.useState<User | null | undefined>(undefined);
  const [error, setError] = React.useState<'NOT_ALLOWED' | 'BLOCKED' | 'ERROR' | null>(null);
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
  const initialRoute = React.useMemo(() => getPageAndIdFromPath(window.location.pathname), []);
  const [page, setPage] = React.useState<Page>(initialRoute.page);
  const [pageId, setPageId] = React.useState<string | undefined>(initialRoute.id);
  const timelineRef = React.useRef<Timeline | null>(null);

  const navigate = React.useCallback((nextPage: Page, id?: string) => {
    setPage(nextPage);
    setPageId(id);
    const path = getPagePath(nextPage, id);
    if (window.location.pathname !== path) {
      window.history.pushState(null, '', path);
    }
  }, []);

  React.useEffect(() => {
    const expectedPath = getPagePath(page, pageId);
    if (window.location.pathname !== expectedPath) {
      window.history.replaceState(null, '', expectedPath);
    }

    const onPopState = () => {
      const route = getPageAndIdFromPath(window.location.pathname);
      setPage(route.page);
      setPageId(route.id);
    };
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
          {error === 'ERROR' && <Error message="An unknown error has occured." />}
          <LoginForm />
        </div>
        <div className="absolute bottom-2">
          <BuildFooter />
        </div>
      </div>
    );
  }

  const canReadBookings = canPerform(user.role, 'BOOKING', 'READ');
  const canReadTableReservations = canPerform(user.role, 'TABLE_RESERVATION', 'READ');

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
          <UtensilsIcon />
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
                      <div className="sticky top-0 z-30 flex flex-row w-full items-center content-center gap-2 p-2 bg-background border-b">
                        <NavMenu
                          user={user}
                          page={page}
                          theme={theme}
                          toggleTheme={toggleTheme}
                          navigate={navigate}
                          setUser={setUser}
                        />
                        <div className="flex flex-row gap-1 sm:gap-2 items-center content-center shrink-0 mx-1">
                          {shortcuts}
                          <SearchBox />
                        </div>
                        <div className="flex flex-1 min-w-0" />
                      </div>
                      {page === 'calendar' ? (
                        <Calendar user={user} navigate={navigate} />
                      ) : page === 'migration' ? (
                        <DataMigration role={user.role} />
                      ) : page === 'bookings-table' ? (
                        <BookingsTable user={user} navigate={navigate} />
                      ) : page === 'booking-create' ? (
                        <BookingCreatePage user={user} navigate={navigate} />
                      ) : page === 'booking-detail' && pageId ? (
                        <BookingDetailPage id={pageId} user={user} navigate={navigate} />
                      ) : page === 'raw-data' ? (
                        <RawData user={user} />
                      ) : page === 'users-table' ? (
                        <UsersTable user={user} />
                      ) : page === 'rooms-table' ? (
                        <RoomsTable user={user} />
                      ) : page === 'prices' ? (
                        <PricesTable user={user} />
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
                      ) : page === 'customer-map' ? (
                        <CustomerHeatmap />
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
