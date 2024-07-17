export const getAmountOfNightsFromDateRange = (
  dateRange: { from: Date | undefined; to: Date | undefined } | undefined,
) => {
  if (!dateRange) return 0;
  if (!dateRange.from) return 0;
  if (!dateRange.to) return 0;

  const startMillis = new Date(dateRange.from).getTime();
  const endMillis = new Date(dateRange.to).getTime();
  const millisDifference = endMillis - startMillis;
  const daysDifference = millisDifference / (1000 * 60 * 60 * 24);
  return Math.round(daysDifference);
};
