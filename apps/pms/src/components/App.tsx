import '../index.css';
import * as React from 'react';
import { AccountingCategoriesTable } from './AccountingCategoriesTable';
import { AccountingCategoryDetailPage } from './AccountingCategoryDetailPage';
import { Analytics } from '@vercel/analytics/react';
import { AuditLog } from './AuditLog';
import { BookingCreatePage } from './BookingCreatePage';
import { BookingDetailPage } from './BookingDetailPage';
import { BookingsTable } from './BookingsTable';
import { Calendar } from './Calendar';
import { CustomerDetailPage } from './CustomerDetailPage';
import { CustomerHeatmap } from './CustomerHeatmap';
import { CustomerMergeSuggestions } from './CustomerMergeSuggestions';
import { CustomersTable } from './CustomersTable';
import { Dashboard } from './Dashboard';
import { Error, Spinner, Toaster } from '@trinserhof/ui';
import { getPagePath, getPageAndIdFromPath } from 'src/helpers/pageRoutes';
import { getSignedInUser, setUserTheme } from '@trinserhof/supabase';
import { InvoiceDetailPage } from './InvoiceDetailPage';
import { InvoiceEditPage } from './InvoiceEditPage';
import { InvoicesTable } from './InvoicesTable';
import { LoginForm } from './LoginForm';
import { OccupancyPricingGrid } from './OccupancyPricingGrid';
import { ProductDetailPage } from './ProductDetailPage';
import { ProductsTable } from './ProductsTable';
import { PropertiesTable } from './PropertiesTable';
import { PropertyDetailPage } from './PropertyDetailPage';
import { RestaurantReservationDetailPage } from './RestaurantReservationDetailPage';
import { RestaurantReservationsTable } from './RestaurantReservationsTable';
import { RestaurantTablesTable } from './RestaurantTablesTable';
import { RoleDetailPage } from './RoleDetailPage';
import { RolesTable } from './RolesTable';
import { RoomDetailPage } from './RoomDetailPage';
import { RoomsTable } from './RoomsTable';
import { RoomTypeDetailPage } from './RoomTypeDetailPage';
import { RoomTypesTable } from './RoomTypesTable';
import { SearchPage } from './SearchPage';
import { Sidebar } from './Sidebar';
import { TableDetailPage } from './TableDetailPage';
import { Timeline } from 'vis-timeline/standalone';
import { TimelineContext } from 'src/context/TimelineContext';
import { type Page } from 'src/types/page';
import { type User } from '@trinserhof/types';
import { UserDetailPage } from './UserDetailPage';
import { UsersTable } from './UsersTable';
import { WipeDataPage } from './WipeDataPage';
import useTheme from 'src/hooks/useTheme';

export const App = () => {
  const [user, setUser] = React.useState<User | null | undefined>(undefined);
  const [error, setError] = React.useState<'BLOCKED' | 'ERROR' | null>(null);
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
          {error === 'BLOCKED' && (
            <Error message="Your account is blocked. Please contact an administrator to get unblocked." />
          )}
          {error === 'ERROR' && <Error message="An unknown error has occured." />}
          <LoginForm />
        </div>
      </div>
    );
  }

  return (
    <TimelineContext.Provider value={timelineRef}>
      <Toaster position="top-center" richColors />
      <div className="flex min-h-dvh w-full">
        <Sidebar
          user={user}
          setUser={setUser}
          navigate={navigate}
          theme={theme}
          toggleTheme={toggleTheme}
          currentPage={page}
        />
        <div className="flex flex-1 flex-col items-center content-center overflow-y-auto">
          {page === 'dashboard' ? (
            <Dashboard user={user} navigate={navigate} />
          ) : page === 'occupancy-pricing-grid' ? (
            <OccupancyPricingGrid user={user} />
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
            <UsersTable user={user} navigate={navigate} />
          ) : page === 'user-detail' && pageId ? (
            <UserDetailPage id={pageId} user={user} navigate={navigate} />
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
          ) : page === 'search' ? (
            <SearchPage user={user} navigate={navigate} />
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
            <AuditLog user={user} />
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
      </div>
      <Analytics />
    </TimelineContext.Provider>
  );
};
