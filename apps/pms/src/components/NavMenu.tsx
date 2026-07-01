import * as React from 'react';
import { ICONS } from '@trinserhof/ui';

import { canPerform, isOwner, type User } from '@trinserhof/types';
import { type Page } from 'src/types/page';

export const NavMenu = ({
  user,

  navigate,
}: {
  user: User;
  navigate: (nextPage: Page) => void;
}) => {
  const canReadAccountingCategories = canPerform(user.role, 'ACCOUNTING_CATEGORY', 'READ');
  const canReadAuditLog = canPerform(user.role, 'AUDIT_LOG', 'READ');
  const canReadCustomers = canPerform(user.role, 'CUSTOMER', 'READ');
  const canReadInvoices = canPerform(user.role, 'INVOICE', 'READ');
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

  const detailsRef = React.useRef<HTMLDetailsElement | null>(null);

  const go = (nextPage: Page) => () => {
    navigate(nextPage);
    if (detailsRef.current) detailsRef.current.open = false;
  };

  return (
    <details ref={detailsRef} className="dropdown">
      <summary className="btn m-1" aria-label="Open navigation menu">
        <ICONS.menu />
      </summary>
      <ul className="menu dropdown-content bg-base-100 rounded-box z-1 w-64 p-2 shadow-sm">
        {canReadDashboard && (
          <li>
            <a onClick={go('dashboard')}>
              <ICONS.dashboard />
              Dashboard
            </a>
          </li>
        )}

        {canReadDashboard && (canReadCalendar || canReadBookings || canReadTableReservations) && (
          <div className="divider my-0" />
        )}

        {canReadCalendar && (
          <li>
            <a onClick={go('calendar')}>
              <ICONS.calendar />
              Calendar
            </a>
          </li>
        )}

        {canReadBookings && (
          <li>
            <a onClick={go('bookings-table')}>
              <ICONS.booking />
              Room reservations
            </a>
          </li>
        )}

        {canReadTableReservations && (
          <li>
            <a onClick={go('table-reservations-table')}>
              <ICONS.table />
              Table reservations
            </a>
          </li>
        )}

        {(canReadCalendar || canReadBookings || canReadTableReservations) &&
          (canReadCustomers || canReadInvoices) && <div className="divider my-0" />}

        {canReadCustomers && (
          <li>
            <a onClick={go('customers-table')}>
              <ICONS.guest />
              Guests
            </a>
          </li>
        )}

        {canReadInvoices && (
          <li>
            <a onClick={go('invoices-table')} aria-disabled={!canReadInvoices}>
              <ICONS.invoice />
              Invoices
            </a>
          </li>
        )}

        {(canReadCustomers || canReadInvoices) &&
          (canReadPrices ||
            canReadRooms ||
            canReadRoomTypes ||
            canReadProperties ||
            canReadTables ||
            canReadProducts ||
            canReadAccountingCategories) && <div className="divider my-0" />}

        {canReadPrices && (
          <li>
            <a onClick={go('prices')} aria-disabled={!canReadPrices}>
              <ICONS.price />
              Room prices
            </a>
          </li>
        )}

        {canReadRoomTypes && (
          <li>
            <a onClick={go('room-types-table')} aria-disabled={!canReadRoomTypes}>
              <ICONS.roomType />
              Room types
            </a>
          </li>
        )}

        {canReadRooms && (
          <li>
            <a onClick={go('rooms-table')} aria-disabled={!canReadRooms}>
              <ICONS.room />
              Rooms
            </a>
          </li>
        )}

        {canReadProperties && (
          <li>
            <a onClick={go('properties-table')} aria-disabled={!canReadProperties}>
              <ICONS.property />
              Properties
            </a>
          </li>
        )}

        {canReadTables && (
          <li>
            <a onClick={go('tables-table')} aria-disabled={!canReadTables}>
              <ICONS.table />
              Tables
            </a>
          </li>
        )}

        {(canReadPrices ||
          canReadRooms ||
          canReadRoomTypes ||
          canReadProperties ||
          canReadTables) &&
          (canReadProducts || canReadAccountingCategories) && <div className="divider my-0" />}

        {canReadProducts && (
          <li>
            <a onClick={go('products-table')} aria-disabled={!canReadProducts}>
              <ICONS.product />
              Products
            </a>
          </li>
        )}

        {canReadAccountingCategories && (
          <li>
            <a
              onClick={go('accounting-categories-table')}
              aria-disabled={!canReadAccountingCategories}
            >
              <ICONS.accountingCategory />
              Accounting categories
            </a>
          </li>
        )}

        {(canReadProducts || canReadAccountingCategories) &&
          (canReadUsers || canReadRoles || canReadAuditLog) && <div className="divider my-0" />}

        {canReadUsers && (
          <li>
            <a onClick={go('users-table')} aria-disabled={!canReadUsers}>
              <ICONS.users />
              Users
            </a>
          </li>
        )}

        {canReadRoles && (
          <li>
            <a onClick={go('roles-table')} aria-disabled={!canReadRoles}>
              <ICONS.role />
              Roles
            </a>
          </li>
        )}

        {canReadAuditLog && (
          <li>
            <a onClick={go('audit-log')} aria-disabled={!canReadAuditLog}>
              <ICONS.auditLog />
              Activity log
            </a>
          </li>
        )}

        {canWipeData && (
          <>
            <div className="divider my-0" />
            <li>
              <a onClick={go('wipe-data')}>
                <ICONS.wipeData />
                Wipe data
              </a>
            </li>
          </>
        )}
      </ul>
    </details>
  );
};
