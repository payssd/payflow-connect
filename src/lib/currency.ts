// Default currency configuration for the app
export const DEFAULT_CURRENCY = 'USD';
export const DEFAULT_LOCALE = 'en-US';

export const formatCurrency = (amount: number, currency: string = DEFAULT_CURRENCY) => {
  return new Intl.NumberFormat(DEFAULT_LOCALE, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount || 0);
};

export const formatUSD = (amount: number) => formatCurrency(amount, 'USD');
