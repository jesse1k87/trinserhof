const formatter = new Intl.DateTimeFormat('de-AT', {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  hour12: false,
});

export const formatDateTime = (date: Date) => formatter.format(date);
