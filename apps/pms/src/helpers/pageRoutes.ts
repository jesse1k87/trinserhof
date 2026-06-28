import { type Page } from 'src/types/page';

// GitHub Pages serves this app from /trinserhof/ (a project page) on jesse1k87.github.io,
// while local dev and any other deployment serve it from the domain root - key the base
// path off the hostname (not just the path) so pushState/replaceState only adjust for it
// on that specific GitHub Pages domain, and a future deploy elsewhere isn't affected.
const REPO_BASE_PATH = '/trinserhof';
const GITHUB_PAGES_HOSTNAME = 'jesse1k87.github.io';

const getBasePath = (): string => {
  const { hostname, pathname } = window.location;
  if (hostname !== GITHUB_PAGES_HOSTNAME) {
    return '';
  }
  return pathname === REPO_BASE_PATH || pathname.startsWith(`${REPO_BASE_PATH}/`)
    ? REPO_BASE_PATH
    : '';
};

const PAGE_PATHS: Record<Page, string> = {
  dashboard: '/',
  calendar: '/calendar',
  'bookings-table': '/bookings',
  'booking-create': '/bookings/new',
  'booking-detail': '/bookings',
  'customers-table': '/customers',
  'customer-map': '/customer-map',
  'customer-merge-suggestions': '/customer-merge-suggestions',
  'invoices-table': '/invoices',
  'invoice-detail': '/invoices',
  'products-table': '/products',
  'accounting-categories-table': '/accounting-categories',
  'users-table': '/users',
  'rooms-table': '/rooms',
  'room-types-table': '/room-types',
  prices: '/prices',
  'tables-table': '/tables',
  'table-reservations-table': '/table-reservations',
  migration: '/migrations',
  'raw-data': '/raw-data',
  'audit-log': '/audit-log',
};

export const getPagePath = (page: Page, id?: string): string => {
  const basePath = getBasePath();
  const suffix = PAGE_PATHS[page];
  if ((page === 'booking-detail' || page === 'invoice-detail') && id) {
    return `${basePath}${suffix}/${id}`;
  }
  return suffix === '/' ? basePath || '/' : `${basePath}${suffix}`;
};

export const getPageAndIdFromPath = (pathname: string): { page: Page; id?: string } => {
  const basePath = getBasePath();
  const relativePath =
    basePath && pathname.startsWith(basePath) ? pathname.slice(basePath.length) || '/' : pathname;

  const entry = Object.entries(PAGE_PATHS).find(
    ([page, path]) =>
      page !== 'booking-detail' && page !== 'invoice-detail' && path === relativePath,
  );
  if (entry) {
    return { page: entry[0] as Page };
  }

  const bookingDetailMatch = relativePath.match(/^\/bookings\/([^/]+)$/);
  if (bookingDetailMatch && bookingDetailMatch[1] !== 'new') {
    return { page: 'booking-detail', id: bookingDetailMatch[1] };
  }

  const invoiceDetailMatch = relativePath.match(/^\/invoices\/([^/]+)$/);
  if (invoiceDetailMatch) {
    return { page: 'invoice-detail', id: invoiceDetailMatch[1] };
  }

  return { page: 'dashboard' };
};
