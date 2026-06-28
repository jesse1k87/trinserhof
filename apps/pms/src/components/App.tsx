import '../index.css';
import * as React from 'react';
import { Analytics } from '@vercel/analytics/react';
import { CustomerContext, CustomerContextType } from 'src/context/CustomerContext';
import { InvoiceContext, InvoiceContextType } from 'src/context/InvoiceContext';
import { ProductContext, ProductContextType } from 'src/context/ProductContext';
import {
  AccountingCategoryContext,
  AccountingCategoryContextType,
} from 'src/context/AccountingCategoryContext';
import { RoomContext, RoomContextType } from 'src/context/RoomContext';
import { RoomTypeContext, RoomTypeContextType } from 'src/context/RoomTypeContext';
import { TimelineContext } from 'src/context/TimelineContext';
import { BookingCreatePage } from './BookingCreatePage';
import { BookingDetailPage } from './BookingDetailPage';
import { InvoiceDetailPage } from './InvoiceDetailPage';
import { InvoiceDetails } from './InvoiceDetails';
import { CustomerDetails } from './CustomerDetails';
import { ProductDetails } from './ProductDetails';
import { AccountingCategoryDetails } from './AccountingCategoryDetails';
import { RoomDetails } from './RoomDetails';
import { RoomTypeDetails } from './RoomTypeDetails';
import { TableDetails } from './TableDetails';
import { RestaurantReservationDetails } from './RestaurantReservationDetails';
import { BookingsTable } from './BookingsTable';
import { InvoicesTable } from './InvoicesTable';
import { CustomersTable } from './CustomersTable';
import { CustomerHeatmap } from './CustomerHeatmap';
import { CustomerMergeSuggestions } from './CustomerMergeSuggestions';
import { ProductsTable } from './ProductsTable';
import { UsersTable } from './UsersTable';
import { RoomsTable } from './RoomsTable';
import { RoomTypesTable } from './RoomTypesTable';
import { PricesTable } from './PricesTable';
import { RestaurantReservationsTable } from './RestaurantReservationsTable';
import { Calendar } from './Calendar';
import { Dashboard } from './Dashboard';
import { DataMigration } from './DataMigration';
import { RawData } from './RawData';
import { AuditLog } from './AuditLog';
import { Error, Spinner, Toaster } from '@trinserhof/ui';
import { getSignedInUser, setUserTheme } from '@trinserhof/firebase';
import { Timeline } from 'vis-timeline/standalone';
import { LoginForm } from './LoginForm';
import useTheme from 'src/hooks/useTheme';
import { type User } from '@trinserhof/types';
import { type Page } from 'src/types/page';
import { getPagePath, getPageAndIdFromPath } from 'src/helpers/pageRoutes';
import { AccountingCategoriesTable } from './AccountingCategoriesTable';
import { SearchBox } from './SearchBox';
import { NavMenu } from './NavMenu';
import { Shortcuts } from './Shortcuts';
import { UserMenu } from './UserMenu';
import {
  RestaurantTableContext,
  RestaurantTableContextType,
} from '../context/RestaurantTableContext';
import {
  RestaurantReservationContext,
  RestaurantReservationContextType,
} from '../context/RetaurantReservationContext';
import { RestaurantTablesTable } from './RestaurantTablesTable';

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

  const [customer, setCustomer] = React.useState<CustomerContextType>(null);
  const [invoice, setInvoice] = React.useState<InvoiceContextType>(null);
  const [product, setProduct] = React.useState<ProductContextType>(null);
  const [accountingCategory, setAccountingCategory] =
    React.useState<AccountingCategoryContextType>(null);
  const [room, setRoom] = React.useState<RoomContextType>(null);
  const [roomType, setRoomType] = React.useState<RoomTypeContextType>(null);
  const [table, setTable] = React.useState<RestaurantTableContextType>(null);
  const [restaurantReservation, setRestaurantReservation] =
    React.useState<RestaurantReservationContextType>(null);
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
          {error === 'BLOCKED' && <Error message="Your access has been restricted." />}
          {error === 'ERROR' && <Error message="An unknown error has occured." />}
          <LoginForm />
        </div>
      </div>
    );
  }

  return (
    <CustomerContext.Provider value={[customer, setCustomer]}>
      <InvoiceContext.Provider value={[invoice, setInvoice]}>
        <ProductContext.Provider value={[product, setProduct]}>
          <AccountingCategoryContext.Provider value={[accountingCategory, setAccountingCategory]}>
            <RoomContext.Provider value={[room, setRoom]}>
              <RoomTypeContext.Provider value={[roomType, setRoomType]}>
              <RestaurantTableContext.Provider value={[table, setTable]}>
                <RestaurantReservationContext.Provider
                  value={[restaurantReservation, setRestaurantReservation]}
                >
                  <TimelineContext.Provider value={timelineRef}>
                    <Toaster position="top-center" richColors />
                    <div className="flex flex-col justify-center items-center content-center">
                      <div className="sticky top-0 z-30 flex flex-row w-full items-center content-center gap-2 p-2 bg-background border-b">
                        <NavMenu user={user} page={page} navigate={navigate} />
                        <div className="flex flex-row gap-1 sm:gap-2 items-center content-center shrink-0 mx-1">
                          <Shortcuts user={user} page={page} navigate={navigate} />
                          <SearchBox navigate={navigate} />
                        </div>
                        <div className="flex flex-1 min-w-0 justify-end items-end">
                          <UserMenu
                            user={user}
                            theme={theme}
                            toggleTheme={toggleTheme}
                            setUser={setUser}
                          />
                        </div>
                      </div>
                      {page === 'dashboard' ? (
                        <Dashboard user={user} navigate={navigate} />
                      ) : page === 'calendar' ? (
                        <Calendar user={user} navigate={navigate} />
                      ) : page === 'migration' ? (
                        <DataMigration role={user.role} email={user.email} />
                      ) : page === 'bookings-table' ? (
                        <BookingsTable user={user} navigate={navigate} />
                      ) : page === 'booking-create' ? (
                        <BookingCreatePage user={user} navigate={navigate} />
                      ) : page === 'booking-detail' && pageId ? (
                        <BookingDetailPage id={pageId} user={user} navigate={navigate} />
                      ) : page === 'invoices-table' ? (
                        <InvoicesTable user={user} navigate={navigate} />
                      ) : page === 'invoice-detail' && pageId ? (
                        <InvoiceDetailPage id={pageId} user={user} navigate={navigate} />
                      ) : page === 'raw-data' ? (
                        <RawData user={user} />
                      ) : page === 'users-table' ? (
                        <UsersTable user={user} />
                      ) : page === 'rooms-table' ? (
                        <RoomsTable user={user} />
                      ) : page === 'room-types-table' ? (
                        <RoomTypesTable user={user} />
                      ) : page === 'prices' ? (
                        <PricesTable user={user} />
                      ) : page === 'tables-table' ? (
                        <RestaurantTablesTable user={user} />
                      ) : page === 'table-reservations-table' ? (
                        <RestaurantReservationsTable user={user} />
                      ) : page === 'products-table' ? (
                        <ProductsTable user={user} />
                      ) : page === 'accounting-categories-table' ? (
                        <AccountingCategoriesTable user={user} />
                      ) : page === 'audit-log' ? (
                        <AuditLog />
                      ) : page === 'customer-map' ? (
                        <CustomerHeatmap />
                      ) : page === 'customer-merge-suggestions' ? (
                        <CustomerMergeSuggestions user={user} />
                      ) : (
                        <CustomersTable user={user} navigate={navigate} />
                      )}
                      {customer && <CustomerDetails user={user} navigate={navigate} />}
                      {invoice && <InvoiceDetails user={user} />}
                      {product && <ProductDetails user={user} />}
                      {accountingCategory && <AccountingCategoryDetails user={user} />}
                      {room && <RoomDetails user={user} />}
                      {roomType && <RoomTypeDetails user={user} />}
                      {table && <TableDetails user={user} />}
                      {restaurantReservation && <RestaurantReservationDetails user={user} />}
                    </div>
                    <Analytics />
                  </TimelineContext.Provider>
                </RestaurantReservationContext.Provider>
              </RestaurantTableContext.Provider>
              </RoomTypeContext.Provider>
            </RoomContext.Provider>
          </AccountingCategoryContext.Provider>
        </ProductContext.Provider>
      </InvoiceContext.Provider>
    </CustomerContext.Provider>
  );
};
