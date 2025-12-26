import { z } from 'zod';

// Base validation patterns for common key formats
const patterns = {
  // Paystack keys start with pk_ or sk_ followed by test_ or live_
  paystackPublic: /^pk_(test|live)_[a-zA-Z0-9]{20,}$/,
  paystackSecret: /^sk_(test|live)_[a-zA-Z0-9]{20,}$/,
  
  // Flutterwave keys start with FLWPUBK_ or FLWSECK_
  flutterwavePublic: /^FLWPUBK(_TEST)?-[a-zA-Z0-9]{20,}-X$/,
  flutterwaveSecret: /^FLWSECK(_TEST)?-[a-zA-Z0-9]{20,}-X$/,
  
  // M-Pesa Daraja keys are alphanumeric
  mpesaConsumerKey: /^[a-zA-Z0-9]{20,}$/,
  mpesaConsumerSecret: /^[a-zA-Z0-9]{20,}$/,
  mpesaPasskey: /^[a-zA-Z0-9]{20,}$/,
  mpesaTillNumber: /^[0-9]{5,10}$/,
  
  // Generic patterns for future integrations
  genericApiKey: /^[a-zA-Z0-9_-]{10,}$/,
  genericSecretKey: /^[a-zA-Z0-9_-]{20,}$/,
};

// Paystack validation schema
export const paystackSchema = z.object({
  isEnabled: z.boolean(),
  isLiveMode: z.boolean(),
  publicKey: z.string()
    .refine((val) => !val || patterns.paystackPublic.test(val), {
      message: "Invalid Paystack public key format. Should start with 'pk_test_' or 'pk_live_'",
    }),
  secretKey: z.string()
    .refine((val) => !val || patterns.paystackSecret.test(val), {
      message: "Invalid Paystack secret key format. Should start with 'sk_test_' or 'sk_live_'",
    }),
}).refine((data) => {
  // If enabled and live mode, require keys
  if (data.isEnabled && data.isLiveMode) {
    return data.publicKey && data.secretKey;
  }
  return true;
}, {
  message: "Public and Secret keys are required when enabling live mode",
  path: ["publicKey"],
}).refine((data) => {
  // Warn if mixing test/live keys
  if (data.publicKey && data.secretKey) {
    const publicIsTest = data.publicKey.includes('_test_');
    const secretIsTest = data.secretKey.includes('_test_');
    return publicIsTest === secretIsTest;
  }
  return true;
}, {
  message: "Public and Secret keys must both be test or both be live keys",
  path: ["secretKey"],
});

// Flutterwave validation schema
export const flutterwaveSchema = z.object({
  isEnabled: z.boolean(),
  isLiveMode: z.boolean(),
  publicKey: z.string()
    .refine((val) => !val || patterns.flutterwavePublic.test(val), {
      message: "Invalid Flutterwave public key format. Should start with 'FLWPUBK_' or 'FLWPUBK_TEST-'",
    }),
  secretKey: z.string()
    .refine((val) => !val || patterns.flutterwaveSecret.test(val), {
      message: "Invalid Flutterwave secret key format. Should start with 'FLWSECK_' or 'FLWSECK_TEST-'",
    }),
}).refine((data) => {
  if (data.isEnabled && data.isLiveMode) {
    return data.publicKey && data.secretKey;
  }
  return true;
}, {
  message: "Public and Secret keys are required when enabling live mode",
  path: ["publicKey"],
}).refine((data) => {
  // Warn if mixing test/live keys
  if (data.publicKey && data.secretKey) {
    const publicIsTest = data.publicKey.includes('_TEST');
    const secretIsTest = data.secretKey.includes('_TEST');
    return publicIsTest === secretIsTest;
  }
  return true;
}, {
  message: "Public and Secret keys must both be test or both be live keys",
  path: ["secretKey"],
});

// M-Pesa Daraja validation schema
export const mpesaDarajaSchema = z.object({
  isEnabled: z.boolean(),
  isLiveMode: z.boolean(),
  tillNumber: z.string()
    .refine((val) => !val || patterns.mpesaTillNumber.test(val), {
      message: "Invalid Till Number. Should be 5-10 digits",
    }),
  consumerKey: z.string()
    .refine((val) => !val || val.length >= 20, {
      message: "Consumer Key should be at least 20 characters",
    }),
  consumerSecret: z.string()
    .refine((val) => !val || val.length >= 20, {
      message: "Consumer Secret should be at least 20 characters",
    }),
  passkey: z.string()
    .refine((val) => !val || val.length >= 20, {
      message: "Passkey should be at least 20 characters",
    }),
}).refine((data) => {
  if (data.isEnabled) {
    return data.tillNumber && data.consumerKey && data.consumerSecret && data.passkey;
  }
  return true;
}, {
  message: "All fields are required when enabling M-Pesa Daraja",
  path: ["tillNumber"],
});

// Generic gateway validation schema factory for future integrations
export function createGatewaySchema(config: {
  publicKeyPattern?: RegExp;
  secretKeyPattern?: RegExp;
  publicKeyMessage?: string;
  secretKeyMessage?: string;
  requireBothKeys?: boolean;
}) {
  return z.object({
    isEnabled: z.boolean(),
    isLiveMode: z.boolean(),
    publicKey: z.string()
      .refine((val) => !val || (config.publicKeyPattern ? config.publicKeyPattern.test(val) : true), {
        message: config.publicKeyMessage || "Invalid public key format",
      }),
    secretKey: z.string()
      .refine((val) => !val || (config.secretKeyPattern ? config.secretKeyPattern.test(val) : true), {
        message: config.secretKeyMessage || "Invalid secret key format",
      }),
  }).refine((data) => {
    if (data.isEnabled && config.requireBothKeys !== false) {
      return data.publicKey && data.secretKey;
    }
    return true;
  }, {
    message: "API keys are required when enabling the gateway",
    path: ["publicKey"],
  });
}

// Validation result type
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

// Validate gateway config
export function validateGatewayConfig(
  provider: 'paystack' | 'flutterwave' | 'mpesa_daraja',
  config: Record<string, unknown>
): ValidationResult {
  let schema;
  
  switch (provider) {
    case 'paystack':
      schema = paystackSchema;
      break;
    case 'flutterwave':
      schema = flutterwaveSchema;
      break;
    case 'mpesa_daraja':
      schema = mpesaDarajaSchema;
      break;
    default:
      return { isValid: true, errors: {} };
  }
  
  const result = schema.safeParse(config);
  
  if (result.success) {
    return { isValid: true, errors: {} };
  }
  
  const errors: Record<string, string> = {};
  result.error.errors.forEach((err) => {
    const path = err.path.join('.');
    errors[path] = err.message;
  });
  
  return { isValid: false, errors };
}

// Helper to check if keys match environment
export function validateKeyEnvironment(
  provider: 'paystack' | 'flutterwave',
  publicKey: string,
  secretKey: string,
  isLiveMode: boolean
): { isValid: boolean; warning?: string } {
  if (!publicKey || !secretKey) {
    return { isValid: true };
  }
  
  let publicIsTest = false;
  let secretIsTest = false;
  
  if (provider === 'paystack') {
    publicIsTest = publicKey.includes('_test_');
    secretIsTest = secretKey.includes('_test_');
  } else if (provider === 'flutterwave') {
    publicIsTest = publicKey.includes('_TEST');
    secretIsTest = secretKey.includes('_TEST');
  }
  
  // Check if keys match each other
  if (publicIsTest !== secretIsTest) {
    return {
      isValid: false,
      warning: "Your public and secret keys don't match. Both should be test or both should be live keys.",
    };
  }
  
  // Check if keys match the selected mode
  if (isLiveMode && publicIsTest) {
    return {
      isValid: true,
      warning: "You have Live Mode enabled but are using test keys. Switch to live keys for production payments.",
    };
  }
  
  if (!isLiveMode && !publicIsTest) {
    return {
      isValid: true,
      warning: "You have Test Mode enabled but are using live keys. Consider using test keys for development.",
    };
  }
  
  return { isValid: true };
}
