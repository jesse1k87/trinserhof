export const getYYYYmmDD = (dateTime: Date | string | undefined) => {
  if (!dateTime) return;
  if (typeof dateTime === 'string') {
    dateTime = new Date(dateTime);
  }

  const year = dateTime.getFullYear();
  const month = String(dateTime.getMonth() + 1).padStart(2, '0');
  const day = dateTime.getDate();

  return `${year}-${month}-${day}`;
};
