import * as React from 'react';
import { Button, cn, ICONS } from '@trinserhof/ui';
import { canPerform, type User } from '@trinserhof/types';
import { type Page } from 'src/types/page';

type ShortcutsProps = {
  user: User;
  page: Page;
  navigate: (page: Page, id?: string) => void;
};

export const Shortcuts = ({ user, page, navigate }: ShortcutsProps) => {
  const canReadCustomers = canPerform(user.role, 'CUSTOMER', 'READ');
  const canReadDashboard = canPerform(user.role, 'PAGE_DASHBOARD', 'READ');
  const canReadBookings = canPerform(user.role, 'BOOKING', 'READ');
  const canReadTableReservations = canPerform(user.role, 'TABLE_RESERVATION', 'READ');
  const canReadCalendar = canPerform(user.role, 'PAGE_CALENDAR', 'READ');

  return (
    <div className="flex flex-row gap-1 sm:gap-2 items-center content-center">
      {canReadDashboard && (
        <Button
          size="icon"
          variant="outline"
          aria-label="Today"
          title="Today"
          className={cn(page === 'dashboard' && 'bg-base-200')}
          onClick={() => navigate('dashboard')}
        >
          <ICONS.dashboard />
        </Button>
      )}
      {canReadCalendar && (
        <Button
          size="icon"
          variant="outline"
          aria-label="Calendar"
          title="Calendar"
          className={cn(page === 'calendar' && 'bg-base-200')}
          onClick={() => navigate('calendar')}
        >
          <ICONS.calendar />
        </Button>
      )}
      {canReadBookings && (
        <Button
          size="icon"
          variant="outline"
          aria-label="Bookings"
          title="Bookings"
          className={cn(page === 'bookings-table' && 'bg-base-200')}
          onClick={() => navigate('bookings-table')}
        >
          <ICONS.bookings />
        </Button>
      )}
      {canReadTableReservations && (
        <Button
          size="icon"
          variant="outline"
          aria-label="Table reservations"
          title="Table reservations"
          className={cn(page === 'table-reservations-table' && 'bg-base-200')}
          onClick={() => navigate('table-reservations-table')}
        >
          <ICONS.restaurantReservations />
        </Button>
      )}
      {canReadCustomers && (
        <Button
          size="icon"
          variant="outline"
          aria-label="Guests"
          title="Guests"
          className={cn(page === 'customers-table' && 'bg-base-200')}
          onClick={() => navigate('customers-table')}
        >
          <ICONS.customers />
        </Button>
      )}
    </div>
  );
};
