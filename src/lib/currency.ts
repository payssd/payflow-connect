// Default currency configuration for the app
// KSH (Kenyan Shilling) is the default for all dashboard/business operations
// USD is used only for platform subscription pricing
export const DEFAULT_CURRENCY = 'KES';
export const DEFAULT_LOCALE = 'en-KE';

export const formatCurrency = (amount: number, currency: string = DEFAULT_CURRENCY) => {
  const locale = currency === 'KES' ? 'en-KE' : 'en-US';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount || 0);
};

export const formatKSH = (amount: number) => formatCurrency(amount, 'KES');
export const formatUSD = (amount: number) => formatCurrency(amount, 'USD');
