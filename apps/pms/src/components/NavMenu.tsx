import * as React from 'react';
import {
  AccountingCategoryIcon,
  AuditLogIcon,
  BookingIcon,
  CalendarIcon,
  DashboardIcon,
  GuestIcon,
  InvoiceIcon,
  OccupancyPricingIcon,
  PropertyIcon,
  RoleIcon,
  RoomIcon,
  RoomTypeIcon,
  SearchIcon,
  TableIcon,
  ProductIcon,
  UsersIcon,
  WipeDataIcon,
} from '@trinserhof/ui';

import { canPerform, isOwner, type User } from '@trinserhof/types';
import { type Page } from 'src/types/page';

type NavItem = {
  page: Page;
  icon: React.ElementType;
  label: string;
};

export const NavMenu = ({
  user,
  navigate,
  isOpen,
  currentPage,
}: {
  user: User;
  navigate: (nextPage: Page) => void;
  isOpen: boolean;
  currentPage: Page;
}) => {
  const canReadAccountingCategories = canPerform(user.role, 'ACCOUNTING_CATEGORY', 'READ');
  const canReadAuditLog = canPerform(user.role, 'AUDIT_LOG', 'READ');
  const canReadCustomers = canPerform(user.role, 'CUSTOMER', 'READ');
  const canReadInvoices = canPerform(user.role, 'INVOICE', 'READ');
  const canReadProducts = canPerform(user.role, 'PRODUCT', 'READ');
  const canReadProperties = canPerform(user.role, 'PROPERTY', 'READ');
  const canReadRoles = canPerform(user.role, 'ROLE', 'READ');
  const canReadRooms = canPerform(user.role, 'ROOM', 'READ');
  const canReadRoomTypes = canPerform(user.role, 'ROOM_TYPE', 'READ');
  const canReadTables = canPerform(user.role, 'TABLE', 'READ');
  const canReadDashboard = canPerform(user.role, 'PAGE_DASHBOARD', 'READ');
  const canReadOccupancyPricing = canPerform(user.role, 'PAGE_OCCUPANCY_PRICING', 'READ');
  const canReadUsers = canPerform(user.role, 'USER', 'READ');
  const canReadBookings = canPerform(user.role, 'BOOKING', 'READ');
  const canReadTableReservations = canPerform(user.role, 'TABLE_RESERVATION', 'READ');
  const canReadCalendar = canPerform(user.role, 'PAGE_CALENDAR', 'READ');
  const canWipeData = isOwner(user.role);

  const items = (...entries: (NavItem | false)[]): NavItem[] =>
    entries.filter((entry): entry is NavItem => entry !== false);

  const groups: NavItem[][] = [
    items(
      canReadDashboard && { page: 'dashboard', icon: DashboardIcon, label: 'Dashboard' },
      canReadOccupancyPricing && {
        page: 'occupancy-pricing-grid',
        icon: OccupancyPricingIcon,
        label: 'Occupancy & pricing',
      },
      { page: 'search', icon: SearchIcon, label: 'Search' },
    ),
    items(
      canReadCalendar && { page: 'calendar', icon: CalendarIcon, label: 'Calendar' },
      canReadBookings && {
        page: 'bookings-table',
        icon: BookingIcon,
        label: 'Room reservations',
      },
      canReadTableReservations && {
        page: 'table-reservations-table',
        icon: TableIcon,
        label: 'Table reservations',
      },
    ),
    items(
      canReadCustomers && { page: 'customers-table', icon: GuestIcon, label: 'Guests' },
      canReadInvoices && { page: 'invoices-table', icon: InvoiceIcon, label: 'Invoices' },
    ),
    items(
      canReadRoomTypes && { page: 'room-types-table', icon: RoomTypeIcon, label: 'Room types' },
      canReadRooms && { page: 'rooms-table', icon: RoomIcon, label: 'Rooms' },
      canReadProperties && {
        page: 'properties-table',
        icon: PropertyIcon,
        label: 'Properties',
      },
      canReadTables && { page: 'tables-table', icon: TableIcon, label: 'Tables' },
    ),
    items(
      canReadProducts && { page: 'products-table', icon: ProductIcon, label: 'Products' },
      canReadAccountingCategories && {
        page: 'accounting-categories-table',
        icon: AccountingCategoryIcon,
        label: 'Accounting categories',
      },
    ),
    items(
      canReadUsers && { page: 'users-table', icon: UsersIcon, label: 'Users' },
      canReadRoles && { page: 'roles-table', icon: RoleIcon, label: 'Roles' },
      canReadAuditLog && { page: 'audit-log', icon: AuditLogIcon, label: 'Activity log' },
    ),
    items(canWipeData && { page: 'wipe-data', icon: WipeDataIcon, label: 'Wipe data' }),
  ].filter((group) => group.length > 0);

  return (
    <ul className="menu w-full p-2">
      {groups.map((group, groupIndex) => (
        <React.Fragment key={group[0]?.page ?? groupIndex}>
          {groupIndex > 0 && <div className="divider my-0 after:h-[0.5px]" />}
          {group.map(({ page, icon: ItemIcon, label }) => (
            <li key={page}>
              <a
                onClick={() => navigate(page)}
                title={isOpen ? undefined : label}
                aria-label={label}
                className={`${page === currentPage ? 'menu-active' : ''} ${
                  isOpen ? '' : 'justify-center'
                }`}
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
