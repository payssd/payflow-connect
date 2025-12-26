// Payment Gateway Registry
// Extensible system for adding new payment gateways

export interface GatewayField {
  name: string;
  label: string;
  type: 'text' | 'password' | 'select';
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
}

export interface PaymentGateway {
  id: string;
  name: string;
  description: string;
  category: 'mobile_money' | 'card_gateway' | 'bank_transfer' | 'aggregator' | 'international';
  logo?: string;
  website?: string;
  isPopular?: boolean;
  isComingSoon?: boolean;
  supportedMethods: string[];
  fields: GatewayField[];
  documentationUrl?: string;
}

export const gatewayCategories = {
  mobile_money: {
    label: 'Mobile Money',
    description: 'Direct mobile money integrations',
    icon: 'Smartphone',
  },
  card_gateway: {
    label: 'Card Payments',
    description: 'Accept debit and credit cards',
    icon: 'CreditCard',
  },
  bank_transfer: {
    label: 'Bank Transfers',
    description: 'Direct bank and EFT payments',
    icon: 'Landmark',
  },
  aggregator: {
    label: 'Payment Aggregators',
    description: 'Multiple payment methods in one',
    icon: 'Layers',
  },
  international: {
    label: 'International Gateways',
    description: 'Cross-border payment solutions',
    icon: 'Globe',
  },
};

// Standard fields for common gateway types
const standardApiKeyFields: GatewayField[] = [
  { name: 'publicKey', label: 'Public Key / API Key', type: 'text', required: true },
  { name: 'secretKey', label: 'Secret Key', type: 'password', required: true },
];

const standardMpesaFields: GatewayField[] = [
  { name: 'consumerKey', label: 'Consumer Key', type: 'password', required: true },
  { name: 'consumerSecret', label: 'Consumer Secret', type: 'password', required: true },
  { name: 'passkey', label: 'Passkey', type: 'password', required: true },
  { name: 'shortcode', label: 'Shortcode / Till Number', type: 'text', required: true },
  { 
    name: 'shortcodeType', 
    label: 'Shortcode Type', 
    type: 'select', 
    options: [
      { value: 'till', label: 'Till Number (Buy Goods)' },
      { value: 'paybill', label: 'Paybill Number' },
    ],
    required: true 
  },
];

export const paymentGateways: PaymentGateway[] = [
  // ==================== MOBILE MONEY ====================
  {
    id: 'mpesa_daraja',
    name: 'M-Pesa (Daraja API)',
    description: 'Direct M-Pesa integration via Safaricom Daraja API. STK Push & C2B.',
    category: 'mobile_money',
    website: 'https://developer.safaricom.co.ke',
    isPopular: true,
    supportedMethods: ['M-Pesa STK Push', 'M-Pesa C2B', 'M-Pesa B2C'],
    documentationUrl: 'https://developer.safaricom.co.ke/APIs',
    fields: standardMpesaFields,
  },
  {
    id: 'airtel_money',
    name: 'Airtel Money',
    description: 'Airtel Money Kenya payment integration',
    category: 'mobile_money',
    website: 'https://www.airtel.co.ke',
    isComingSoon: true,
    supportedMethods: ['Airtel Money'],
    fields: [
      { name: 'clientId', label: 'Client ID', type: 'text', required: true },
      { name: 'clientSecret', label: 'Client Secret', type: 'password', required: true },
    ],
  },
  {
    id: 'equitel',
    name: 'Equitel (Finserve)',
    description: 'Equity Bank mobile money and payment APIs',
    category: 'mobile_money',
    website: 'https://equitygroupholdings.com',
    isComingSoon: true,
    supportedMethods: ['Equitel', 'EazzyPay'],
    fields: standardApiKeyFields,
  },
  {
    id: 'sasapay',
    name: 'SasaPay',
    description: 'Multi-channel mobile payment platform by Viewtech Limited',
    category: 'mobile_money',
    website: 'https://sasapay.co.ke',
    isComingSoon: true,
    supportedMethods: ['SasaPay Wallet', 'M-Pesa', 'Card'],
    fields: standardApiKeyFields,
  },
  {
    id: 'tkash',
    name: 'T-Kash',
    description: 'Telkom Kenya mobile money service',
    category: 'mobile_money',
    website: 'https://telkom.co.ke',
    isComingSoon: true,
    supportedMethods: ['T-Kash'],
    fields: standardApiKeyFields,
  },

  // ==================== PAYMENT AGGREGATORS ====================
  {
    id: 'paystack',
    name: 'Paystack',
    description: 'Accept cards, M-Pesa, bank transfers. Developer-friendly APIs.',
    category: 'aggregator',
    website: 'https://paystack.com',
    isPopular: true,
    supportedMethods: ['Cards', 'M-Pesa', 'Bank Transfer'],
    documentationUrl: 'https://paystack.com/docs',
    fields: standardApiKeyFields,
  },
  {
    id: 'flutterwave',
    name: 'Flutterwave',
    description: 'Pan-African payments. Cards, mobile money, bank transfers.',
    category: 'aggregator',
    website: 'https://flutterwave.com',
    isPopular: true,
    supportedMethods: ['Cards', 'M-Pesa', 'Airtel Money', 'Bank Transfer'],
    documentationUrl: 'https://developer.flutterwave.com',
    fields: standardApiKeyFields,
  },
  {
    id: 'pesapal',
    name: 'Pesapal',
    description: 'Kenya\'s leading payment gateway. Cards, M-Pesa, Airtel Money.',
    category: 'aggregator',
    website: 'https://pesapal.com',
    isPopular: true,
    supportedMethods: ['Cards', 'M-Pesa', 'Airtel Money', 'Equitel'],
    documentationUrl: 'https://developer.pesapal.com',
    fields: [
      { name: 'consumerKey', label: 'Consumer Key', type: 'text', required: true },
      { name: 'consumerSecret', label: 'Consumer Secret', type: 'password', required: true },
    ],
  },
  {
    id: 'cellulant_tingg',
    name: 'Tingg by Cellulant',
    description: 'Pan-African checkout. 150+ payment options across 35 countries.',
    category: 'aggregator',
    website: 'https://tingg.africa',
    isPopular: true,
    supportedMethods: ['M-Pesa', 'Airtel Money', 'Cards', 'Bank'],
    documentationUrl: 'https://dev-portal.tingg.africa',
    fields: [
      { name: 'serviceCode', label: 'Service Code', type: 'text', required: true },
      { name: 'ivKey', label: 'IV Key', type: 'password', required: true },
      { name: 'secretKey', label: 'Secret Key', type: 'password', required: true },
    ],
  },
  {
    id: 'ipay_africa',
    name: 'iPay Africa',
    description: 'Local payment gateway by Fivespot Kenya. M-Pesa, Airtel, Cards.',
    category: 'aggregator',
    website: 'https://ipayafrica.com',
    supportedMethods: ['M-Pesa', 'Airtel Money', 'Cards', 'Equitel'],
    documentationUrl: 'https://dev.ipayafrica.com',
    fields: [
      { name: 'vendorId', label: 'Vendor ID', type: 'text', required: true },
      { name: 'hashKey', label: 'Hash Key', type: 'password', required: true },
    ],
  },
  {
    id: 'jambopay',
    name: 'JamboPay',
    description: 'Digital payments platform by Web Tribe Limited.',
    category: 'aggregator',
    website: 'https://jambopay.com',
    isComingSoon: true,
    supportedMethods: ['M-Pesa', 'Cards', 'JamboPay Wallet'],
    fields: standardApiKeyFields,
  },
  {
    id: 'kora',
    name: 'Kora Payments',
    description: 'Multi-method API for cards and mobile money across Africa.',
    category: 'aggregator',
    website: 'https://korapay.com',
    supportedMethods: ['Cards', 'Mobile Money', 'Bank Transfer'],
    documentationUrl: 'https://docs.korapay.com',
    fields: standardApiKeyFields,
  },
  {
    id: 'dpo_directpay',
    name: 'DPO (Direct Pay Online)',
    description: 'Pan-African payment gateway. Cards, mobile money, bank.',
    category: 'aggregator',
    website: 'https://directpayonline.com',
    supportedMethods: ['Cards', 'M-Pesa', 'Bank Transfer'],
    documentationUrl: 'https://directpayonline.atlassian.net',
    fields: [
      { name: 'companyToken', label: 'Company Token', type: 'password', required: true },
      { name: 'serviceType', label: 'Service Type', type: 'text', required: true },
    ],
  },
  {
    id: 'pesaflow',
    name: 'Pesaflow',
    description: 'Revenue collection and payment solutions for organizations.',
    category: 'aggregator',
    website: 'https://pesaflow.co.ke',
    isComingSoon: true,
    supportedMethods: ['M-Pesa', 'Cards', 'Bank Transfer'],
    fields: standardApiKeyFields,
  },
  {
    id: 'xprizo',
    name: 'Xprizo',
    description: 'Kenya-focused payment gateway with developer-friendly API.',
    category: 'aggregator',
    website: 'https://xprizo.com',
    isComingSoon: true,
    supportedMethods: ['M-Pesa', 'Cards', 'Bank Transfer'],
    fields: standardApiKeyFields,
  },
  {
    id: 'loop_pay',
    name: 'Loop Pay',
    description: 'Payment solutions by Loop Payco Limited.',
    category: 'aggregator',
    website: 'https://looppay.co.ke',
    isComingSoon: true,
    supportedMethods: ['M-Pesa', 'Cards'],
    fields: standardApiKeyFields,
  },
  {
    id: 'virtualpay',
    name: 'Virtual Pay',
    description: 'Digital payment solutions by Virtual Pay International.',
    category: 'aggregator',
    website: 'https://virtualpay.co.ke',
    isComingSoon: true,
    supportedMethods: ['M-Pesa', 'Cards', 'Bank Transfer'],
    fields: standardApiKeyFields,
  },
  {
    id: 'pesawise',
    name: 'Pesawise',
    description: 'Payment services by Pesawise Services Limited.',
    category: 'aggregator',
    website: 'https://pesawise.com',
    isComingSoon: true,
    supportedMethods: ['M-Pesa', 'Bank Transfer'],
    fields: standardApiKeyFields,
  },
  {
    id: 'craft_silicon',
    name: 'Craft Silicon',
    description: 'Enterprise payment and banking solutions.',
    category: 'aggregator',
    website: 'https://craftsilicon.com',
    isComingSoon: true,
    supportedMethods: ['M-Pesa', 'Cards', 'Bank'],
    fields: standardApiKeyFields,
  },
  {
    id: 'interswitch',
    name: 'Interswitch',
    description: 'Digital payments infrastructure across Africa.',
    category: 'aggregator',
    website: 'https://www.interswitchgroup.com',
    isComingSoon: true,
    supportedMethods: ['Cards', 'Bank Transfer'],
    fields: standardApiKeyFields,
  },

  // ==================== BANK TRANSFERS ====================
  {
    id: 'pesalink',
    name: 'PesaLink (IPSL)',
    description: 'Real-time bank transfers via Integrated Payment Services.',
    category: 'bank_transfer',
    website: 'https://ipsl.co.ke',
    isComingSoon: true,
    supportedMethods: ['Bank Transfer'],
    fields: [
      { name: 'bankCode', label: 'Bank Code', type: 'text', required: true },
      { name: 'merchantId', label: 'Merchant ID', type: 'text', required: true },
      { name: 'apiKey', label: 'API Key', type: 'password', required: true },
    ],
  },
  {
    id: 'kenswitch',
    name: 'Kenswitch',
    description: 'National payment switch for Kenyan banks.',
    category: 'bank_transfer',
    website: 'https://kenswitch.com',
    isComingSoon: true,
    supportedMethods: ['ATM', 'POS', 'Bank Transfer'],
    fields: standardApiKeyFields,
  },

  // ==================== INTERNATIONAL ====================
  {
    id: 'dlocal',
    name: 'dLocal',
    description: 'Cross-border payments in emerging markets.',
    category: 'international',
    website: 'https://dlocal.com',
    supportedMethods: ['Cards', 'Mobile Money', 'Bank Transfer'],
    documentationUrl: 'https://docs.dlocal.com',
    fields: [
      { name: 'xLogin', label: 'X-Login', type: 'text', required: true },
      { name: 'xTransKey', label: 'X-Trans-Key', type: 'password', required: true },
      { name: 'secretKey', label: 'Secret Key', type: 'password', required: true },
    ],
  },
  {
    id: 'unlimint',
    name: 'Unlimint',
    description: 'Global payment solutions for digital businesses.',
    category: 'international',
    website: 'https://www.unlimint.com',
    isComingSoon: true,
    supportedMethods: ['Cards', 'Alternative Payments'],
    fields: standardApiKeyFields,
  },
  {
    id: 'payu',
    name: 'PayU',
    description: 'Global payment service provider. (Note: Exited Kenya market)',
    category: 'international',
    website: 'https://payu.com',
    isComingSoon: true,
    supportedMethods: ['Cards'],
    fields: standardApiKeyFields,
  },

  // ==================== DEVELOPER TOOLS ====================
  {
    id: 'africastalking',
    name: 'Africa\'s Talking',
    description: 'SMS, USSD, and mobile payment APIs for developers.',
    category: 'aggregator',
    website: 'https://africastalking.com',
    supportedMethods: ['M-Pesa', 'Card (via partners)'],
    documentationUrl: 'https://developers.africastalking.com',
    fields: [
      { name: 'username', label: 'Username', type: 'text', required: true },
      { name: 'apiKey', label: 'API Key', type: 'password', required: true },
    ],
  },
];

// Helper functions
export function getGatewayById(id: string): PaymentGateway | undefined {
  return paymentGateways.find(g => g.id === id);
}

export function getGatewaysByCategory(category: string): PaymentGateway[] {
  return paymentGateways.filter(g => g.category === category);
}

export function getPopularGateways(): PaymentGateway[] {
  return paymentGateways.filter(g => g.isPopular);
}

export function getActiveGateways(): PaymentGateway[] {
  return paymentGateways.filter(g => !g.isComingSoon);
}

export function searchGateways(query: string): PaymentGateway[] {
  const lowerQuery = query.toLowerCase();
  return paymentGateways.filter(g => 
    g.name.toLowerCase().includes(lowerQuery) ||
    g.description.toLowerCase().includes(lowerQuery) ||
    g.supportedMethods.some(m => m.toLowerCase().includes(lowerQuery))
  );
}
