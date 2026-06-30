import '../index.css';
import * as React from 'react';
import { Analytics } from '@vercel/analytics/react';
import { TimelineContext } from 'src/context/TimelineContext';
import { BookingCreatePage } from './BookingCreatePage';
import { BookingDetailPage } from './BookingDetailPage';
import { InvoiceDetailPage } from './InvoiceDetailPage';
import { InvoiceEditPage } from './InvoiceEditPage';
import { CustomerDetailPage } from './CustomerDetailPage';
import { ProductDetailPage } from './ProductDetailPage';
import { AccountingCategoryDetailPage } from './AccountingCategoryDetailPage';
import { RoomDetailPage } from './RoomDetailPage';
import { RoomTypeDetailPage } from './RoomTypeDetailPage';
import { TableDetailPage } from './TableDetailPage';
import { RestaurantReservationDetailPage } from './RestaurantReservationDetailPage';
import { BookingsTable } from './BookingsTable';
import { InvoicesTable } from './InvoicesTable';
import { CustomersTable } from './CustomersTable';
import { CustomerHeatmap } from './CustomerHeatmap';
import { CustomerMergeSuggestions } from './CustomerMergeSuggestions';
import { ProductsTable } from './ProductsTable';
import { UsersTable } from './UsersTable';
import { RolesTable } from './RolesTable';
import { RoleDetailPage } from './RoleDetailPage';
import { RoomsTable } from './RoomsTable';
import { RoomTypesTable } from './RoomTypesTable';
import { PropertiesTable } from './PropertiesTable';
import { PropertyDetailPage } from './PropertyDetailPage';
import { PricesTable } from './PricesTable';
import { RestaurantReservationsTable } from './RestaurantReservationsTable';
import { Calendar } from './Calendar';
import { Dashboard } from './Dashboard';
import { AuditLog } from './AuditLog';
import { WipeDataPage } from './WipeDataPage';
import { Error, Spinner, Toaster } from '@trinserhof/ui';
import { getSignedInUser, setUserTheme } from '@trinserhof/supabase';
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
    <TimelineContext.Provider value={timelineRef}>
      <Toaster position="top-center" richColors />
      <div className="flex flex-col justify-center items-center content-center">
        <div className="sticky top-0 z-30 flex flex-row w-full items-center content-center gap-2 p-2 border-b bg-base-100">
          <NavMenu user={user} page={page} navigate={navigate} />
          <div className="flex flex-row gap-1 sm:gap-2 items-center content-center shrink-0 mx-1">
            <Shortcuts user={user} page={page} navigate={navigate} />
            <SearchBox navigate={navigate} />
          </div>
          <div className="flex flex-1 min-w-0 justify-end items-end">
            <UserMenu user={user} theme={theme} toggleTheme={toggleTheme} setUser={setUser} />
          </div>
        </div>
        {page === 'dashboard' ? (
          <Dashboard user={user} navigate={navigate} />
        ) : page === 'calendar' ? (
          <Calendar user={user} navigate={navigate} />
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
        ) : page === 'invoice-edit' && pageId ? (
          <InvoiceEditPage id={pageId} user={user} navigate={navigate} />
        ) : page === 'users-table' ? (
          <UsersTable user={user} />
        ) : page === 'roles-table' ? (
          <RolesTable user={user} navigate={navigate} />
        ) : page === 'role-detail' && pageId ? (
          <RoleDetailPage id={pageId} user={user} navigate={navigate} />
        ) : page === 'rooms-table' ? (
          <RoomsTable user={user} navigate={navigate} />
        ) : page === 'room-detail' && pageId ? (
          <RoomDetailPage id={pageId} user={user} navigate={navigate} />
        ) : page === 'room-types-table' ? (
          <RoomTypesTable user={user} navigate={navigate} />
        ) : page === 'room-type-detail' && pageId ? (
          <RoomTypeDetailPage id={pageId} user={user} navigate={navigate} />
        ) : page === 'properties-table' ? (
          <PropertiesTable user={user} navigate={navigate} />
        ) : page === 'property-detail' && pageId ? (
          <PropertyDetailPage id={pageId} user={user} navigate={navigate} />
        ) : page === 'prices' ? (
          <PricesTable user={user} />
        ) : page === 'tables-table' ? (
          <RestaurantTablesTable user={user} navigate={navigate} />
        ) : page === 'table-detail' && pageId ? (
          <TableDetailPage id={pageId} user={user} navigate={navigate} />
        ) : page === 'table-reservations-table' ? (
          <RestaurantReservationsTable user={user} navigate={navigate} />
        ) : page === 'table-reservation-detail' && pageId ? (
          <RestaurantReservationDetailPage id={pageId} user={user} navigate={navigate} />
        ) : page === 'products-table' ? (
          <ProductsTable user={user} navigate={navigate} />
        ) : page === 'product-detail' && pageId ? (
          <ProductDetailPage id={pageId} user={user} navigate={navigate} />
        ) : page === 'accounting-categories-table' ? (
          <AccountingCategoriesTable user={user} navigate={navigate} />
        ) : page === 'accounting-category-detail' && pageId ? (
          <AccountingCategoryDetailPage id={pageId} user={user} navigate={navigate} />
        ) : page === 'audit-log' ? (
          <AuditLog />
        ) : page === 'wipe-data' ? (
          <WipeDataPage user={user} />
        ) : page === 'customer-detail' && pageId ? (
          <CustomerDetailPage id={pageId} user={user} navigate={navigate} />
        ) : page === 'customer-map' ? (
          <CustomerHeatmap />
        ) : page === 'customer-merge-suggestions' ? (
          <CustomerMergeSuggestions user={user} />
        ) : (
          <CustomersTable user={user} navigate={navigate} />
        )}
      </div>
      <Analytics />
    </TimelineContext.Provider>
  );
};
