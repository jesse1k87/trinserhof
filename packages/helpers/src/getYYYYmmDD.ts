export const getYYYYmmDD = (dateTime: Date | string) => {
  if (typeof dateTime === 'string') {
    dateTime = new Date(dateTime);
  }

  const year = dateTime.getFullYear();
  const month = String(dateTime.getMonth() + 1).padStart(2, '0');
  const day = String(dateTime.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};
