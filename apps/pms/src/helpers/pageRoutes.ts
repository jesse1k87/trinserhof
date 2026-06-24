import { type Page } from 'src/types/page';

export const PAGE_PATHS: Record<Page, string> = {
  calendar: '/',
  'bookings-table': '/reservations',
  'customers-table': '/guests',
  'products-table': '/products',
  'product-categories-table': '/product-categories',
  'users-table': '/users',
  'rooms-table': '/rooms',
  migration: '/migrations',
  'raw-data': '/raw-data',
  'audit-log': '/audit-log',
};

export const getPageFromPath = (pathname: string): Page => {
  const entry = Object.entries(PAGE_PATHS).find(([, path]) => path === pathname);
  return (entry?.[0] as Page | undefined) ?? 'calendar';
};
