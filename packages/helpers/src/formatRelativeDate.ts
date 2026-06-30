import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

export const formatRelativeDate = (date: Date) =>
  formatDistanceToNow(date, { addSuffix: true, locale: de });
