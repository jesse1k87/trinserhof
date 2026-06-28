import * as React from 'react';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  PAGE_ICONS,
  MenuIcon,
  cn,
} from '@trinserhof/ui';

import { canPerform, type User } from '@trinserhof/types';
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
  const canReadRawData = canPerform(user.role, 'RAW_DATA', 'READ');
  const canReadRooms = canPerform(user.role, 'ROOM', 'READ');
  const canReadRoomTypes = canPerform(user.role, 'ROOM_TYPE', 'READ');
  const canReadTables = canPerform(user.role, 'TABLE', 'READ');
  const canReadUsers = canPerform(user.role, 'USER', 'READ');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="ghost" aria-label="Open navigation menu">
          <MenuIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {canReadCustomers && (
          <DropdownMenuItem
            onClick={() => navigate('customers-table')}
            className={navItemClassName('customers-table')}
            disabled={!canReadCustomers}
          >
            <PAGE_ICONS.customers />
            Customers
          </DropdownMenuItem>
        )}

        {canReadInvoices && (
          <DropdownMenuItem
            onClick={() => navigate('invoices-table')}
            className={navItemClassName('invoices-table')}
            disabled={!canReadInvoices}
          >
            <PAGE_ICONS.invoices />
            Invoices
          </DropdownMenuItem>
        )}

        {(canReadRooms ||
          canReadRoomTypes ||
          canReadTables ||
          canReadPrices ||
          canReadProducts ||
          canReadAccountingCategories ||
          canReadAuditLog) && <DropdownMenuSeparator />}

        {canReadRooms && (
          <DropdownMenuItem
            onClick={() => navigate('rooms-table')}
            className={navItemClassName('rooms-table')}
            disabled={!canReadRooms}
          >
            <PAGE_ICONS.rooms />
            Rooms
          </DropdownMenuItem>
        )}

        {canReadRoomTypes && (
          <DropdownMenuItem
            onClick={() => navigate('room-types-table')}
            className={navItemClassName('room-types-table')}
            disabled={!canReadRoomTypes}
          >
            <PAGE_ICONS.roomTypes />
            Room types
          </DropdownMenuItem>
        )}

        {canReadTables && (
          <DropdownMenuItem
            onClick={() => navigate('tables-table')}
            className={navItemClassName('tables-table')}
            disabled={!canReadTables}
          >
            <PAGE_ICONS.tables />
            Tables
          </DropdownMenuItem>
        )}

        {canReadPrices && (
          <DropdownMenuItem
            onClick={() => navigate('prices')}
            className={navItemClassName('prices')}
            disabled={!canReadPrices}
          >
            <PAGE_ICONS.prices />
            Room prices
          </DropdownMenuItem>
        )}

        {canReadProducts && (
          <DropdownMenuItem
            onClick={() => navigate('products-table')}
            className={navItemClassName('products-table')}
            disabled={!canReadProducts}
          >
            <PAGE_ICONS.products />
            Products
          </DropdownMenuItem>
        )}

        {canReadAccountingCategories && (
          <DropdownMenuItem
            onClick={() => navigate('accounting-categories-table')}
            className={navItemClassName('accounting-categories-table')}
            disabled={!canReadAccountingCategories}
          >
            <PAGE_ICONS.accountingCategories />
            Accounting categories
          </DropdownMenuItem>
        )}

        {canReadAuditLog && (
          <DropdownMenuItem
            onClick={() => navigate('audit-log')}
            className={navItemClassName('audit-log')}
            disabled={!canReadAuditLog}
          >
            <PAGE_ICONS.auditLog />
            Activity log
          </DropdownMenuItem>
        )}

        {(canReadUsers || canReadMigrations || canReadRawData) && <DropdownMenuSeparator />}

        {canReadUsers && (
          <DropdownMenuItem
            onClick={() => navigate('users-table')}
            className={navItemClassName('users-table')}
            disabled={!canReadUsers}
          >
            <PAGE_ICONS.users />
            Users
          </DropdownMenuItem>
        )}

        {canReadMigrations && (
          <DropdownMenuItem
            onClick={() => navigate('migration')}
            className={navItemClassName('migration')}
            disabled={!canReadMigrations}
          >
            <PAGE_ICONS.migration />
            Data migrations
          </DropdownMenuItem>
        )}

        {canReadRawData && (
          <DropdownMenuItem
            onClick={() => navigate('raw-data')}
            className={navItemClassName('raw-data')}
            disabled={!canReadRawData}
          >
            <PAGE_ICONS.rawData />
            Raw data
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
