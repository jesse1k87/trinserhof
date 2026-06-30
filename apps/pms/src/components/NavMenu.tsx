import * as React from 'react';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  ICONS,
  cn,
} from '@trinserhof/ui';

import { canPerform, isOwner, type User } from '@trinserhof/types';
import { type Page } from 'src/types/page';

export const NavMenu = ({
  user,
  page,
  navigate,
}: {
  user: User;
  page: Page;
  navigate: (nextPage: Page) => void;
}) => {
  const navItemClassName = (itemPage: Page) =>
    cn('gap-2 hover:cursor-pointer', page === itemPage && 'bg-base-200 font-medium');

  const canReadAccountingCategories = canPerform(user.role, 'ACCOUNTING_CATEGORY', 'READ');
  const canReadAuditLog = canPerform(user.role, 'AUDIT_LOG', 'READ');
  const canReadCustomers = canPerform(user.role, 'CUSTOMER', 'READ');
  const canReadInvoices = canPerform(user.role, 'INVOICE', 'READ');
  const canReadMigrations = canPerform(user.role, 'USER', 'READ');
  const canReadPrices = canPerform(user.role, 'PRICE', 'READ');
  const canReadProducts = canPerform(user.role, 'PRODUCT', 'READ');
  const canReadProperties = canPerform(user.role, 'PROPERTY', 'READ');
  const canReadRoles = canPerform(user.role, 'ROLE', 'READ');
  const canReadRooms = canPerform(user.role, 'ROOM', 'READ');
  const canReadRoomTypes = canPerform(user.role, 'ROOM_TYPE', 'READ');
  const canReadTables = canPerform(user.role, 'TABLE', 'READ');
  const canReadDashboard = canPerform(user.role, 'PAGE_DASHBOARD', 'READ');
  const canReadUsers = canPerform(user.role, 'USER', 'READ');
  const canReadBookings = canPerform(user.role, 'BOOKING', 'READ');
  const canReadTableReservations = canPerform(user.role, 'TABLE_RESERVATION', 'READ');
  const canReadCalendar = canPerform(user.role, 'PAGE_CALENDAR', 'READ');
  const canWipeData = isOwner(user.role);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="ghost" aria-label="Open navigation menu">
          <ICONS.menu />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {canReadDashboard && (
          <DropdownMenuItem
            onClick={() => navigate('dashboard')}
            className={navItemClassName('dashboard')}
          >
            <ICONS.dashboard />
            Dashboard
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        {canReadCalendar && (
          <DropdownMenuItem
            onClick={() => navigate('calendar')}
            className={navItemClassName('calendar')}
          >
            <ICONS.calendar />
            Calendar
          </DropdownMenuItem>
        )}

        {canReadBookings && (
          <DropdownMenuItem
            onClick={() => navigate('bookings-table')}
            className={navItemClassName('bookings-table')}
          >
            <ICONS.booking />
            Room reservations
          </DropdownMenuItem>
        )}

        {canReadTableReservations && (
          <DropdownMenuItem
            onClick={() => navigate('table-reservations-table')}
            className={navItemClassName('table-reservations-table')}
          >
            <ICONS.table />
            Table reservations
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        {canReadCustomers && (
          <DropdownMenuItem
            onClick={() => navigate('customers-table')}
            className={navItemClassName('customers-table')}
          >
            <ICONS.guest />
            Guests
          </DropdownMenuItem>
        )}

        {canReadInvoices && (
          <DropdownMenuItem
            onClick={() => navigate('invoices-table')}
            className={navItemClassName('invoices-table')}
            disabled={!canReadInvoices}
          >
            <ICONS.invoice />
            Invoices
          </DropdownMenuItem>
        )}

        {(canReadPrices ||
          canReadRooms ||
          canReadRoomTypes ||
          canReadProperties ||
          canReadTables ||
          canReadPrices ||
          canReadProducts ||
          canReadAccountingCategories) && <DropdownMenuSeparator />}

        {canReadPrices && (
          <DropdownMenuItem
            onClick={() => navigate('prices')}
            className={navItemClassName('prices')}
            disabled={!canReadPrices}
          >
            <ICONS.price />
            Room prices
          </DropdownMenuItem>
        )}

        {canReadRoomTypes && (
          <DropdownMenuItem
            onClick={() => navigate('room-types-table')}
            className={navItemClassName('room-types-table')}
            disabled={!canReadRoomTypes}
          >
            <ICONS.roomType />
            Room types
          </DropdownMenuItem>
        )}

        {canReadRooms && (
          <DropdownMenuItem
            onClick={() => navigate('rooms-table')}
            className={navItemClassName('rooms-table')}
            disabled={!canReadRooms}
          >
            <ICONS.room />
            Rooms
          </DropdownMenuItem>
        )}

        {canReadProperties && (
          <DropdownMenuItem
            onClick={() => navigate('properties-table')}
            className={navItemClassName('properties-table')}
            disabled={!canReadProperties}
          >
            <ICONS.property />
            Properties
          </DropdownMenuItem>
        )}

        {canReadTables && (
          <DropdownMenuItem
            onClick={() => navigate('tables-table')}
            className={navItemClassName('tables-table')}
            disabled={!canReadTables}
          >
            <ICONS.table />
            Tables
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        {canReadProducts && (
          <DropdownMenuItem
            onClick={() => navigate('products-table')}
            className={navItemClassName('products-table')}
            disabled={!canReadProducts}
          >
            <ICONS.product />
            Products
          </DropdownMenuItem>
        )}

        {canReadAccountingCategories && (
          <DropdownMenuItem
            onClick={() => navigate('accounting-categories-table')}
            className={navItemClassName('accounting-categories-table')}
            disabled={!canReadAccountingCategories}
          >
            <ICONS.accountingCategory />
            Accounting categories
          </DropdownMenuItem>
        )}

        {(canReadUsers || canReadRoles || canReadMigrations) && <DropdownMenuSeparator />}

        {canReadUsers && (
          <DropdownMenuItem
            onClick={() => navigate('users-table')}
            className={navItemClassName('users-table')}
            disabled={!canReadUsers}
          >
            <ICONS.users />
            Users
          </DropdownMenuItem>
        )}

        {canReadRoles && (
          <DropdownMenuItem
            onClick={() => navigate('roles-table')}
            className={navItemClassName('roles-table')}
            disabled={!canReadRoles}
          >
            <ICONS.role />
            Roles
          </DropdownMenuItem>
        )}

        {canReadAuditLog && (
          <DropdownMenuItem
            onClick={() => navigate('audit-log')}
            className={navItemClassName('audit-log')}
            disabled={!canReadAuditLog}
          >
            <ICONS.auditLog />
            Activity log
          </DropdownMenuItem>
        )}

        {canWipeData && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => navigate('wipe-data')}
              className={cn(navItemClassName('wipe-data'), 'text-destructive')}
            >
              <ICONS.wipeData />
              Wipe data
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
