import { DEFAULT_LOCALE, type Locale } from '@trinserhof/types';

export const formatCurrency = (
  amount: number,
  maximumFractionDigits = 2,
  locale: Locale = DEFAULT_LOCALE,
) =>
  new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits,
  }).format(amount);
