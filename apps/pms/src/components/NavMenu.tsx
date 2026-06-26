import * as React from 'react';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  cn,
} from '@trinserhof/ui';
import {
  Sun as SunIcon,
  Moon as MoonIcon,
  Menu as MenuIcon,
  User as PersonIcon,
  CircleUserRound as AvatarIcon,
  House as HomeIcon,
  BadgeEuro as PriceIcon,
  RefreshCw as UpdateIcon,
  FileText as FileTextIcon,
  ScrollText as ActivityLogIcon,
  Archive as ArchiveIcon,
  BookMarked as BookMarkedIcon,
  LayoutTemplate as LayoutTemplateIcon,
  Map as MapIcon,
} from 'lucide-react';
import { logOut } from '@trinserhof/database';
import { canPerform, type User } from '@trinserhof/types';
import { type Page } from 'src/types/page';

type NavMenuProps = {
  user: User;
  page: Page;
  theme: string | undefined;
  toggleTheme: () => void;
  navigate: (nextPage: Page) => void;
  setUser: React.Dispatch<React.SetStateAction<User | null | undefined>>;
};

export const NavMenu = ({ user, page, theme, toggleTheme, navigate, setUser }: NavMenuProps) => {
  const navItemClassName = (itemPage: Page) =>
    cn('gap-2 hover:cursor-pointer', page === itemPage && 'bg-base-200 font-medium');

  const canReadCustomers = canPerform(user.role, 'CUSTOMER', 'READ');
  const canReadProducts = canPerform(user.role, 'PRODUCT', 'READ');
  const canReadRooms = canPerform(user.role, 'ROOM', 'READ');
  const canReadPrices = canPerform(user.role, 'PRICE', 'READ');
  const canReadTables = canPerform(user.role, 'TABLE', 'READ');
  const canReadAccountingCategories = canPerform(user.role, 'ACCOUNTING_CATEGORY', 'READ');
  const canReadAuditLog = canPerform(user.role, 'AUDIT_LOG', 'READ');
  const canReadUsers = canPerform(user.role, 'USER', 'READ');
  const canReadMigrations = canPerform(user.role, 'USER', 'READ');
  const canReadRawData = canPerform(user.role, 'RAW_DATA', 'READ');

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
          >
            <PersonIcon />
            Customers
          </DropdownMenuItem>
        )}
        {canReadCustomers && (
          <DropdownMenuItem
            onClick={() => navigate('customer-map')}
            className={navItemClassName('customer-map')}
          >
            <MapIcon />
            Customer map
          </DropdownMenuItem>
        )}

        {(canReadRooms ||
          canReadPrices ||
          canReadTables ||
          canReadProducts ||
          canReadAccountingCategories) && <DropdownMenuSeparator />}

        {canReadRooms && (
          <DropdownMenuItem
            onClick={() => navigate('rooms-table')}
            className={navItemClassName('rooms-table')}
          >
            <HomeIcon />
            Rooms
          </DropdownMenuItem>
        )}
        {canReadTables && (
          <DropdownMenuItem
            onClick={() => navigate('tables-table')}
            className={navItemClassName('tables-table')}
          >
            <LayoutTemplateIcon />
            Tables
          </DropdownMenuItem>
        )}
        {canReadPrices && (
          <DropdownMenuItem
            onClick={() => navigate('prices')}
            className={navItemClassName('prices')}
          >
            <PriceIcon />
            Room prices
          </DropdownMenuItem>
        )}
        {canReadProducts && (
          <DropdownMenuItem
            onClick={() => navigate('products-table')}
            className={navItemClassName('products-table')}
          >
            <ArchiveIcon />
            Products
          </DropdownMenuItem>
        )}
        {canReadAccountingCategories && (
          <DropdownMenuItem
            onClick={() => navigate('accounting-categories-table')}
            className={navItemClassName('accounting-categories-table')}
          >
            <BookMarkedIcon />
            Accounting categories
          </DropdownMenuItem>
        )}

        {(canReadUsers || canReadAuditLog || canReadRawData) && <DropdownMenuSeparator />}

        {canReadUsers && (
          <DropdownMenuItem
            onClick={() => navigate('users-table')}
            className={navItemClassName('users-table')}
          >
            <AvatarIcon />
            Users
          </DropdownMenuItem>
        )}
        {canReadAuditLog && (
          <DropdownMenuItem
            onClick={() => navigate('audit-log')}
            className={navItemClassName('audit-log')}
          >
            <ActivityLogIcon />
            Audit log
          </DropdownMenuItem>
        )}
        {canReadMigrations && (
          <DropdownMenuItem
            onClick={() => navigate('migration')}
            className={navItemClassName('migration')}
          >
            <UpdateIcon />
            Data migrations
          </DropdownMenuItem>
        )}
        {canReadRawData && (
          <DropdownMenuItem
            onClick={() => navigate('raw-data')}
            className={navItemClassName('raw-data')}
          >
            <FileTextIcon />
            Raw data
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={toggleTheme} className="gap-2 hover:cursor-pointer">
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="gap-2 cursor-default"
          onSelect={(event) => event.preventDefault()}
        >
          {user.image ? (
            <img
              src={user.image}
              alt={user.email}
              className="h-6 w-6 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="h-6 w-6 shrink-0 rounded-full bg-muted flex items-center justify-center text-xs">
              {user.email[0]?.toUpperCase()}
            </div>
          )}
          <span className="font-normal text-xs truncate">{user.email}</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => logOut(setUser)} className="hover:cursor-pointer">
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
