// Kenya Tax Calculator - 2024 rates
// Based on KRA regulations

// PAYE Tax Bands (Monthly) - 2024
const PAYE_BANDS = [
  { min: 0, max: 24000, rate: 0.10 },
  { min: 24000, max: 32333, rate: 0.25 },
  { min: 32333, max: 500000, rate: 0.30 },
  { min: 500000, max: 800000, rate: 0.325 },
  { min: 800000, max: Infinity, rate: 0.35 },
];

// Personal Relief (Monthly)
const PERSONAL_RELIEF = 2400;

// NHIF Rates (Monthly)
const NHIF_RATES = [
  { min: 0, max: 5999, amount: 150 },
  { min: 6000, max: 7999, amount: 300 },
  { min: 8000, max: 11999, amount: 400 },
  { min: 12000, max: 14999, amount: 500 },
  { min: 15000, max: 19999, amount: 600 },
  { min: 20000, max: 24999, amount: 750 },
  { min: 25000, max: 29999, amount: 850 },
  { min: 30000, max: 34999, amount: 900 },
  { min: 35000, max: 39999, amount: 950 },
  { min: 40000, max: 44999, amount: 1000 },
  { min: 45000, max: 49999, amount: 1100 },
  { min: 50000, max: 59999, amount: 1200 },
  { min: 60000, max: 69999, amount: 1300 },
  { min: 70000, max: 79999, amount: 1400 },
  { min: 80000, max: 89999, amount: 1500 },
  { min: 90000, max: 99999, amount: 1600 },
  { min: 100000, max: Infinity, amount: 1700 },
];

// NSSF Rates (Tier I and II combined) - 2024
// Tier I: 6% of pensionable earnings up to KES 7,000
// Tier II: 6% of pensionable earnings between KES 7,000 and KES 36,000
const NSSF_TIER1_LIMIT = 7000;
const NSSF_TIER2_LIMIT = 36000;
const NSSF_RATE = 0.06;

export interface TaxCalculation {
  grossPay: number;
  taxableIncome: number;
  paye: number;
  nhif: number;
  nssf: number;
  totalDeductions: number;
  netPay: number;
}

export function calculatePAYE(grossPay: number): number {
  let tax = 0;
  let remainingIncome = grossPay;
  let previousMax = 0;

  for (const band of PAYE_BANDS) {
    if (remainingIncome <= 0) break;
    
    const taxableInBand = Math.min(remainingIncome, band.max - previousMax);
    tax += taxableInBand * band.rate;
    remainingIncome -= taxableInBand;
    previousMax = band.max;
  }

  // Apply personal relief
  const payeAfterRelief = Math.max(0, tax - PERSONAL_RELIEF);
  
  return Math.round(payeAfterRelief * 100) / 100;
}

export function calculateNHIF(grossPay: number): number {
  for (const rate of NHIF_RATES) {
    if (grossPay >= rate.min && grossPay <= rate.max) {
      return rate.amount;
    }
  }
  return 1700; // Maximum NHIF
}

export function calculateNSSF(grossPay: number): number {
  // Tier I contribution
  const tier1Contribution = Math.min(grossPay, NSSF_TIER1_LIMIT) * NSSF_RATE;
  
  // Tier II contribution
  const tier2Earnings = Math.min(Math.max(grossPay - NSSF_TIER1_LIMIT, 0), NSSF_TIER2_LIMIT - NSSF_TIER1_LIMIT);
  const tier2Contribution = tier2Earnings * NSSF_RATE;
  
  const totalNSSF = tier1Contribution + tier2Contribution;
  
  return Math.round(totalNSSF * 100) / 100;
}

export function calculateTax(grossPay: number, otherDeductions: number = 0): TaxCalculation {
  const paye = calculatePAYE(grossPay);
  const nhif = calculateNHIF(grossPay);
  const nssf = calculateNSSF(grossPay);
  
  const totalDeductions = paye + nhif + nssf + otherDeductions;
  const netPay = grossPay - totalDeductions;

  return {
    grossPay,
    taxableIncome: grossPay,
    paye,
    nhif,
    nssf,
    totalDeductions,
    netPay: Math.round(netPay * 100) / 100,
  };
}

export function formatKES(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
