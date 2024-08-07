export const formatCurrency = (amount: number, maximumFractionDigits = 2) =>
  new Intl.NumberFormat('de-AT', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits,
  }).format(amount);
