import * as React from 'react';
import { ICONS, type Icon } from '@trinserhof/ui';

import { canPerform, isOwner, type User } from '@trinserhof/types';
import { type Page } from 'src/types/page';

type NavItem = {
  page: Page;
  icon: Icon;
  label: string;
};

export const NavMenu = ({
  user,
  navigate,
  isOpen,
}: {
  user: User;
  navigate: (nextPage: Page) => void;
  isOpen: boolean;
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

  const items = (...entries: (NavItem | false)[]): NavItem[] =>
    entries.filter((entry): entry is NavItem => entry !== false);

  const groups: NavItem[][] = [
    items(canReadDashboard && { page: 'dashboard', icon: ICONS.dashboard, label: 'Dashboard' }),
    items(
      canReadCalendar && { page: 'calendar', icon: ICONS.calendar, label: 'Calendar' },
      canReadBookings && {
        page: 'bookings-table',
        icon: ICONS.booking,
        label: 'Room reservations',
      },
      canReadTableReservations && {
        page: 'table-reservations-table',
        icon: ICONS.table,
        label: 'Table reservations',
      },
    ),
    items(
      canReadCustomers && { page: 'customers-table', icon: ICONS.guest, label: 'Guests' },
      canReadInvoices && { page: 'invoices-table', icon: ICONS.invoice, label: 'Invoices' },
    ),
    items(
      canReadPrices && { page: 'prices', icon: ICONS.price, label: 'Room prices' },
      canReadRoomTypes && { page: 'room-types-table', icon: ICONS.roomType, label: 'Room types' },
      canReadRooms && { page: 'rooms-table', icon: ICONS.room, label: 'Rooms' },
      canReadProperties && {
        page: 'properties-table',
        icon: ICONS.property,
        label: 'Properties',
      },
      canReadTables && { page: 'tables-table', icon: ICONS.table, label: 'Tables' },
    ),
    items(
      canReadProducts && { page: 'products-table', icon: ICONS.product, label: 'Products' },
      canReadAccountingCategories && {
        page: 'accounting-categories-table',
        icon: ICONS.accountingCategory,
        label: 'Accounting categories',
      },
    ),
    items(
      canReadUsers && { page: 'users-table', icon: ICONS.users, label: 'Users' },
      canReadRoles && { page: 'roles-table', icon: ICONS.role, label: 'Roles' },
      canReadAuditLog && { page: 'audit-log', icon: ICONS.auditLog, label: 'Activity log' },
    ),
    items(canWipeData && { page: 'wipe-data', icon: ICONS.wipeData, label: 'Wipe data' }),
  ].filter((group) => group.length > 0);

  return (
    <ul className="menu w-full p-2">
      {groups.map((group, groupIndex) => (
        <React.Fragment key={group[0]?.page ?? groupIndex}>
          {groupIndex > 0 && <div className="divider my-0" />}
          {group.map(({ page, icon: ItemIcon, label }) => (
            <li key={page}>
              <a
                onClick={() => navigate(page)}
                title={isOpen ? undefined : label}
                aria-label={label}
                className={isOpen ? undefined : 'justify-center'}
              >
                <ItemIcon />
                {isOpen && label}
              </a>
            </li>
          ))}
        </React.Fragment>
      ))}
    </ul>
  );
};
