const formatter = new Intl.DateTimeFormat('en-US', {
  // weekday: 'short',
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  //   day: 'numeric',
  //   hour: 'numeric',
  //   minute: 'numeric',
});

export const formatDate = (date: Date) => formatter.format(date);
