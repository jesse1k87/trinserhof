import * as React from 'react';
import { Button, ICONS } from '@trinserhof/ui';
import { canPerform, type User } from '@trinserhof/types';
import { type Page } from 'src/types/page';

export const Shortcuts = ({
  user,
  navigate,
}: {
  user: User;
  navigate: (page: Page, id?: string) => void;
}) => {
  const canReadCustomers = canPerform(user.role, 'CUSTOMER', 'READ');
  const canReadDashboard = canPerform(user.role, 'PAGE_DASHBOARD', 'READ');
  const canReadBookings = canPerform(user.role, 'BOOKING', 'READ');
  const canReadTableReservations = canPerform(user.role, 'TABLE_RESERVATION', 'READ');
  const canReadCalendar = canPerform(user.role, 'PAGE_CALENDAR', 'READ');

  return (
    <div className="flex flex-row gap-1 sm:gap-2 items-center content-center">
      {canReadDashboard && (
        <Button aria-label="Today" title="Today" onClick={() => navigate('dashboard')}>
          <ICONS.dashboard />
        </Button>
      )}
      {canReadCalendar && (
        <Button aria-label="Calendar" title="Calendar" onClick={() => navigate('calendar')}>
          <ICONS.calendar />
        </Button>
      )}
      {canReadBookings && (
        <Button aria-label="Bookings" title="Bookings" onClick={() => navigate('bookings-table')}>
          <ICONS.booking />
        </Button>
      )}
      {canReadTableReservations && (
        <Button
          aria-label="Table reservations"
          title="Table reservations"
          onClick={() => navigate('table-reservations-table')}
        >
          <ICONS.tableBooking />
        </Button>
      )}
      {canReadCustomers && (
        <Button aria-label="Guests" title="Guests" onClick={() => navigate('customers-table')}>
          <ICONS.guest />
        </Button>
      )}
    </div>
  );
};
