import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, NoAccess, PageHeader } from '@trinserhof/ui';
import {
  formatDateTime,
  getRestaurantReservationDateStatus,
  getYYYYmmDD,
} from '@trinserhof/helpers';
import {
  type Booking,
  BOOKING_STATUSES,
  type BookingStatus,
  canPerform,
  type Customer,
  DEFAULT_BOOKING_STATUS,
  type RestaurantTable,
  type User,
} from '@trinserhof/types';
import {
  DashboardIcon,
  ArrivalIcon,
  DepartureIcon,
  HomeIcon as StayingIcon,
  UtensilsIcon,
  BedIcon,
  UsersIcon,
  UserIcon as AdultIcon,
  ChildIcon,
  PetIcon,
} from '@trinserhof/ui';
import useCollection from 'src/hooks/useCollection';
import useCustomers from 'src/hooks/useCustomers';
import useRestaurantTables from 'src/hooks/useRestaurantTables';
import { type Page } from 'src/types/page';
import { BookingStatusIndicator } from './BookingStatusIndicator';
import useRestaurantReservations from '../hooks/useRestaurantReservations';
import { RestaurantReservationContext } from '../context/RetaurantReservationContext';

const getBookingStatus = (booking: Booking): BookingStatus =>
  BOOKING_STATUSES.some((status) => status.id === booking.status)
    ? booking.status
    : DEFAULT_BOOKING_STATUS;

const formatCustomerName = (customer: Customer): string =>
  [customer.name, customer.surname].filter(Boolean).join(' ') || customer.email || 'Unnamed guest';

const getGuestNames = (booking: Booking, customersById: Map<string, Customer>): string => {
  const names = (booking.customers ?? [])
    .map((id) => customersById.get(id))
    .filter((c): c is Customer => Boolean(c))
    .map(formatCustomerName);
  return names.length ? names.join(', ') : 'Unknown guest';
};

const OccupantsIcons = ({ booking }: { booking: Booking }) => {
  const { adults, children, pets } = booking;
  return (
    <div className="flex flex-wrap items-center gap-1">
      {Array.from({ length: adults }).map((_, i) => (
        <AdultIcon key={`adult-${i}`} className="size-4" aria-label="Adult" />
      ))}
      {Array.from({ length: children }).map((_, i) => (
        <ChildIcon key={`child-${i}`} className="size-4" aria-label="Child" />
      ))}
      {Array.from({ length: pets }).map((_, i) => (
        <PetIcon key={`pet-${i}`} className="size-4" aria-label="Pet" />
      ))}
    </div>
  );
};

const BookingRow = ({
  booking,
  customersById,
  onClick,
}: {
  booking: Booking;
  customersById: Map<string, Customer>;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className="flex w-full items-center justify-between gap-3 rounded-md border bg-base-100 px-3 py-2 text-left transition-colors hover:bg-base-200"
  >
    <div className="flex min-w-0 flex-col">
      <span className="truncate text-lg font-semibold leading-tight">
        {getGuestNames(booking, customersById)}
      </span>
      <span className="flex items-center gap-1 text-sm text-muted-foreground">
        <BedIcon className="size-4" />
        Room {booking.roomId || '—'}
      </span>
    </div>
    <div className="flex shrink-0 items-center gap-3">
      <OccupantsIcons booking={booking} />
      <BookingStatusIndicator status={getBookingStatus(booking)} />
    </div>
  </button>
);

const Section = ({
  icon,
  title,
  count,
  emptyText,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  count: number;
  emptyText: string;
  children: React.ReactNode;
}) => (
  <Card className="w-full">
    <CardHeader className="p-3">
      <CardTitle className="flex items-center gap-2 text-sm">
        {icon}
        {title}
        <span className="ml-auto rounded-full bg-base-200 px-2.5 py-0.5 text-sm font-semibold">
          {count}
        </span>
      </CardTitle>
    </CardHeader>
    <CardContent className="flex flex-col gap-1.5 p-3 pt-0">
      {count ? (
        children
      ) : (
        <p className="py-1 text-center text-sm text-muted-foreground">{emptyText}</p>
      )}
    </CardContent>
  </Card>
);

export const Dashboard = ({
  user,
  navigate,
}: {
  user: User;
  navigate: (page: Page, id?: string) => void;
}) => {
  if (!canPerform(user.role, 'PAGE_DASHBOARD', 'READ')) return <NoAccess />;

  const bookings = useCollection('bookings');
  const customers = useCustomers();
  const restaurantReservations = useRestaurantReservations();
  const tables = useRestaurantTables();
  const [, setRestaurantReservation] = React.useContext(RestaurantReservationContext);

  const today = getYYYYmmDD(new Date());

  const customersById = React.useMemo(
    () => new Map(customers.map((customer) => [customer.id, customer])),
    [customers],
  );

  const tablesById = React.useMemo(
    () => new Map(tables.map((table) => [table.id, table])),
    [tables],
  );

  const isActive = (booking: Booking) => getBookingStatus(booking) !== 'CANCELLED';

  const arrivals = React.useMemo(
    () =>
      bookings
        .filter((booking) => booking.checkIn === today && isActive(booking))
        .sort((a, b) => (a.roomId > b.roomId ? 1 : -1)),
    [bookings, today],
  );

  const departures = React.useMemo(
    () =>
      bookings
        .filter((booking) => booking.checkOut === today && isActive(booking))
        .sort((a, b) => (a.roomId > b.roomId ? 1 : -1)),
    [bookings, today],
  );

  // In-house guests who are neither arriving nor departing today: they checked
  // in before today and check out after today.
  const staying = React.useMemo(
    () =>
      bookings
        .filter(
          (booking) => booking.checkIn < today && booking.checkOut > today && isActive(booking),
        )
        .sort((a, b) => (a.roomId > b.roomId ? 1 : -1)),
    [bookings, today],
  );

  const reservationsToday = React.useMemo(
    () =>
      restaurantReservations
        .filter((reservation) => getRestaurantReservationDateStatus(reservation.start) === 'TODAY')
        .sort((a, b) => (a.start > b.start ? 1 : -1)),
    [restaurantReservations],
  );

  const todayLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="flex w-full max-w-5xl flex-col gap-3 px-4 py-4">
      <PageHeader icon={<DashboardIcon className="size-5" />} title="Today">
        <span className="ml-auto text-sm text-muted-foreground">{todayLabel}</span>
      </PageHeader>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Section
          icon={<DepartureIcon className="size-5 text-blue-500" />}
          title="Departing today"
          count={departures.length}
          emptyText="No departures today."
        >
          {departures.map((booking) => (
            <BookingRow
              key={booking.id}
              booking={booking}
              customersById={customersById}
              onClick={() => navigate('booking-detail', booking.id)}
            />
          ))}
        </Section>

        <Section
          icon={<ArrivalIcon className="size-5 text-orange-500" />}
          title="Arriving today"
          count={arrivals.length}
          emptyText="No arrivals today."
        >
          {arrivals.map((booking) => (
            <BookingRow
              key={booking.id}
              booking={booking}
              customersById={customersById}
              onClick={() => navigate('booking-detail', booking.id)}
            />
          ))}
        </Section>

        <Section
          icon={<StayingIcon className="size-5 text-violet-500" />}
          title="Staying today"
          count={staying.length}
          emptyText="No other guests staying today."
        >
          {staying.map((booking) => (
            <BookingRow
              key={booking.id}
              booking={booking}
              customersById={customersById}
              onClick={() => navigate('booking-detail', booking.id)}
            />
          ))}
        </Section>

        <Section
          icon={<UtensilsIcon className="size-5 text-green-600" />}
          title="Table reservations today"
          count={reservationsToday.length}
          emptyText="No table reservations today."
        >
          {reservationsToday.map((reservation) => {
            const customer = reservation.customerId
              ? customersById.get(reservation.customerId)
              : undefined;
            const table: RestaurantTable | undefined = reservation.tableId
              ? tablesById.get(reservation.tableId)
              : undefined;
            return (
              <button
                key={reservation.id}
                type="button"
                onClick={() => setRestaurantReservation(reservation)}
                className="flex w-full items-center justify-between gap-3 rounded-md border bg-base-100 px-3 py-2 text-left transition-colors hover:bg-base-200"
              >
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-lg font-semibold leading-tight">
                    {customer ? formatCustomerName(customer) : 'Guest'}
                  </span>
                  <span className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <UsersIcon className="size-4" />
                      {reservation.numberOfPeople}{' '}
                      {reservation.numberOfPeople === 1 ? 'person' : 'people'}
                    </span>
                    {table && (
                      <span className="flex items-center gap-1">
                        <UtensilsIcon className="size-4" />
                        Table {table.number}
                        {table.areaName ? ` · ${table.areaName}` : ''}
                      </span>
                    )}
                  </span>
                </div>
                <span className="shrink-0 text-lg font-semibold tabular-nums">
                  {formatDateTime(new Date(reservation.start)).split(', ').pop()}
                </span>
              </button>
            );
          })}
        </Section>
      </div>
    </div>
  );
};
