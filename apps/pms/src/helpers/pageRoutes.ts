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
  'customer-detail': '/customers',
  'customer-map': '/customer-map',
  'customer-merge-suggestions': '/customer-merge-suggestions',
  'invoices-table': '/invoices',
  'invoice-detail': '/invoices',
  'invoice-edit': '/invoices',
  'products-table': '/products',
  'product-detail': '/products',
  'properties-table': '/properties',
  'property-detail': '/properties',
  'accounting-categories-table': '/accounting-categories',
  'accounting-category-detail': '/accounting-categories',
  'users-table': '/users',
  'user-detail': '/users',
  'roles-table': '/roles',
  'role-detail': '/roles',
  'rooms-table': '/rooms',
  'room-detail': '/rooms',
  'room-types-table': '/room-types',
  'room-type-detail': '/room-types',
  prices: '/prices',
  search: '/search',
  'tables-table': '/tables',
  'table-detail': '/tables',
  'table-reservations-table': '/table-reservations',
  'table-reservation-detail': '/table-reservations',
  'raw-data': '/raw-data',
  'audit-log': '/audit-log',
  'wipe-data': '/wipe-data',
};

const DETAIL_PAGE_BASES: [base: string, page: Page][] = [
  ['/bookings', 'booking-detail'],
  ['/customers', 'customer-detail'],
  ['/products', 'product-detail'],
  ['/properties', 'property-detail'],
  ['/accounting-categories', 'accounting-category-detail'],
  ['/users', 'user-detail'],
  ['/roles', 'role-detail'],
  ['/rooms', 'room-detail'],
  ['/room-types', 'room-type-detail'],
  ['/tables', 'table-detail'],
  ['/table-reservations', 'table-reservation-detail'],
  ['/invoices', 'invoice-detail'],
];

const DETAIL_PAGES = new Set<Page>(DETAIL_PAGE_BASES.map(([, page]) => page));

export const getPagePath = (page: Page, id?: string): string => {
  const basePath = getBasePath();

  // Invoices have a dedicated editor page that lives under /invoices: /invoices/new to
  // create, /invoices/<id>/edit to edit (the bare /invoices/<id> is the read-only view).
  if (page === 'invoice-edit') {
    return id && id !== 'new' ? `${basePath}/invoices/${id}/edit` : `${basePath}/invoices/new`;
  }

  const suffix = PAGE_PATHS[page];
  if (DETAIL_PAGES.has(page) && id) {
    return `${basePath}${suffix}/${id}`;
  }
  return suffix === '/' ? basePath || '/' : `${basePath}${suffix}`;
};

export const getPageAndIdFromPath = (pathname: string): { page: Page; id?: string } => {
  const basePath = getBasePath();
  const relativePath =
    basePath && pathname.startsWith(basePath) ? pathname.slice(basePath.length) || '/' : pathname;

  // Invoice create/edit live under /invoices but route to the dedicated editor page.
  if (relativePath === '/invoices/new') {
    return { page: 'invoice-edit', id: 'new' };
  }
  const invoiceEditMatch = relativePath.match(/^\/invoices\/([^/]+)\/edit$/);
  if (invoiceEditMatch) {
    return { page: 'invoice-edit', id: invoiceEditMatch[1] };
  }

  // Exact (non-detail) page paths, e.g. /customers -> customers-table, /bookings/new ->
  // booking-create. Detail and invoice-edit pages share base paths, so skip them here.
  const entry = Object.entries(PAGE_PATHS).find(
    ([page, path]) =>
      !DETAIL_PAGES.has(page as Page) && page !== 'invoice-edit' && path === relativePath,
  );
  if (entry) {
    return { page: entry[0] as Page };
  }

  // Detail pages: /<base>/<id> (id is 'new' when creating, except bookings which use
  // their own /bookings/new create page handled by the exact lookup above).
  for (const [base, page] of DETAIL_PAGE_BASES) {
    if (relativePath.startsWith(`${base}/`)) {
      const id = relativePath.slice(base.length + 1);
      if (id && !id.includes('/')) {
        return { page, id };
      }
    }
  }

  return { page: 'dashboard' };
};
