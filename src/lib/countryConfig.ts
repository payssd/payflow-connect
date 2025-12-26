// Multi-country configuration - Kenya only at launch
// Architecture ready for future expansion

export interface CountryConfig {
  code: string;
  name: string;
  flag: string;
  currency: string;
  currencySymbol: string;
  enabled: boolean;
  comingSoon: boolean;
  vatRate: number;
  payrollRules: {
    hasPAYE: boolean;
    hasNSSF: boolean;
    hasNHIF: boolean;
    hasHousingLevy: boolean;
  };
}

export const COUNTRIES: Record<string, CountryConfig> = {
  KE: {
    code: 'KE',
    name: 'Kenya',
    flag: '🇰🇪',
    currency: 'KES',
    currencySymbol: 'KES',
    enabled: true,
    comingSoon: false,
    vatRate: 16,
    payrollRules: {
      hasPAYE: true,
      hasNSSF: true,
      hasNHIF: true,
      hasHousingLevy: true,
    },
  },
  UG: {
    code: 'UG',
    name: 'Uganda',
    flag: '🇺🇬',
    currency: 'UGX',
    currencySymbol: 'UGX',
    enabled: false,
    comingSoon: true,
    vatRate: 18,
    payrollRules: {
      hasPAYE: true,
      hasNSSF: true,
      hasNHIF: false,
      hasHousingLevy: false,
    },
  },
  TZ: {
    code: 'TZ',
    name: 'Tanzania',
    flag: '🇹🇿',
    currency: 'TZS',
    currencySymbol: 'TZS',
    enabled: false,
    comingSoon: true,
    vatRate: 18,
    payrollRules: {
      hasPAYE: true,
      hasNSSF: true,
      hasNHIF: false,
      hasHousingLevy: false,
    },
  },
  RW: {
    code: 'RW',
    name: 'Rwanda',
    flag: '🇷🇼',
    currency: 'RWF',
    currencySymbol: 'RWF',
    enabled: false,
    comingSoon: true,
    vatRate: 18,
    payrollRules: {
      hasPAYE: true,
      hasNSSF: true,
      hasNHIF: false,
      hasHousingLevy: false,
    },
  },
  NG: {
    code: 'NG',
    name: 'Nigeria',
    flag: '🇳🇬',
    currency: 'NGN',
    currencySymbol: '₦',
    enabled: false,
    comingSoon: true,
    vatRate: 7.5,
    payrollRules: {
      hasPAYE: true,
      hasNSSF: false,
      hasNHIF: false,
      hasHousingLevy: false,
    },
  },
  GH: {
    code: 'GH',
    name: 'Ghana',
    flag: '🇬🇭',
    currency: 'GHS',
    currencySymbol: 'GH₵',
    enabled: false,
    comingSoon: true,
    vatRate: 15,
    payrollRules: {
      hasPAYE: true,
      hasNSSF: true,
      hasNHIF: false,
      hasHousingLevy: false,
    },
  },
};

export const ENABLED_COUNTRIES = Object.values(COUNTRIES).filter(c => c.enabled);
export const ALL_COUNTRIES = Object.values(COUNTRIES);

export function getCountryConfig(countryCode: string): CountryConfig {
  return COUNTRIES[countryCode] || COUNTRIES.KE;
}

export function loadPayrollRules(countryCode: string) {
  const config = getCountryConfig(countryCode);
  return config.payrollRules;
}

export function loadTaxRules(countryCode: string) {
  const config = getCountryConfig(countryCode);
  return {
    vatRate: config.vatRate,
    currency: config.currency,
  };
}

export function formatCurrency(amount: number, countryCode: string = 'KE'): string {
  const config = getCountryConfig(countryCode);
  return `${config.currencySymbol} ${amount.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

export const DEFAULT_COUNTRY = 'KE';
export const DEFAULT_CURRENCY = 'KES';
