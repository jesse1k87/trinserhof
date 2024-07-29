export const removeTimeFromDate = (dateTime: Date | string | undefined) => {
  if (!dateTime) return;
  if (typeof dateTime === 'string') {
    dateTime = new Date(dateTime);
  }

  const dateWithoutTime = new Date(dateTime.getFullYear(), dateTime.getMonth(), dateTime.getDate());

  return dateWithoutTime;
};
