import * as React from 'react';
import { Button, cn, PAGE_ICONS } from '@trinserhof/ui';
import { canPerform, type User } from '@trinserhof/types';
import { type Page } from 'src/types/page';

type ShortcutsProps = {
  user: User;
  page: Page;
  navigate: (page: Page, id?: string) => void;
};

export const Shortcuts = ({ user, page, navigate }: ShortcutsProps) => {
  const canReadBookings = canPerform(user.role, 'BOOKING', 'READ');
  const canReadTableReservations = canPerform(user.role, 'TABLE_RESERVATION', 'READ');

  return (
    <div className="flex flex-row gap-1 sm:gap-2 items-center content-center">
      {canReadBookings && (
        <Button
          size="icon"
          variant="outline"
          aria-label="Today"
          title="Today"
          className={cn(page === 'dashboard' && 'bg-base-200')}
          onClick={() => navigate('dashboard')}
        >
          <PAGE_ICONS.dashboard />
        </Button>
      )}
      {canReadBookings && (
        <Button
          size="icon"
          variant="outline"
          aria-label="Calendar"
          title="Calendar"
          className={cn(page === 'calendar' && 'bg-base-200')}
          onClick={() => navigate('calendar')}
        >
          <PAGE_ICONS.calendar />
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
          <PAGE_ICONS.bookings />
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
          <PAGE_ICONS.tableReservations />
        </Button>
      )}
    </div>
  );
};
