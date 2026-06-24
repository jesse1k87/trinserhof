import { type Page } from 'src/types/page';

// GitHub Pages serves this app from /trinserhof/ (a project page), while local dev and
// any other deployment serve it from the domain root - detect which one we're in so
// pushState/replaceState never navigate outside the directory the app was loaded from.
const REPO_BASE_PATH = '/trinserhof';

const getBasePath = (): string => {
  const { pathname } = window.location;
  return pathname === REPO_BASE_PATH || pathname.startsWith(`${REPO_BASE_PATH}/`)
    ? REPO_BASE_PATH
    : '';
};

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

export const getPagePath = (page: Page): string => {
  const basePath = getBasePath();
  const suffix = PAGE_PATHS[page];
  return suffix === '/' ? basePath || '/' : `${basePath}${suffix}`;
};

export const getPageFromPath = (pathname: string): Page => {
  const basePath = getBasePath();
  const relativePath =
    basePath && pathname.startsWith(basePath) ? pathname.slice(basePath.length) || '/' : pathname;
  const entry = Object.entries(PAGE_PATHS).find(([, path]) => path === relativePath);
  return (entry?.[0] as Page | undefined) ?? 'calendar';
};
