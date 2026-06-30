import { DEFAULT_LOCALE, type Locale } from '@trinserhof/types';

export const formatDateTime = (date: Date, locale: Locale = DEFAULT_LOCALE) =>
  new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  }).format(date);
