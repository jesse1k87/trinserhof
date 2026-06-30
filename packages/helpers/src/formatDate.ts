import { DEFAULT_LOCALE, type Locale } from '@trinserhof/types';

export const formatDate = (date: Date, locale: Locale = DEFAULT_LOCALE) =>
  new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).format(date);
