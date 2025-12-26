import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ValidationRequest {
  provider: string;
  isLiveMode: boolean;
  // Provider-specific fields
  publicKey?: string;
  secretKey?: string;
  consumerKey?: string;
  consumerSecret?: string;
  passkey?: string;
  tillNumber?: string;
}

interface ValidationResponse {
  isValid: boolean;
  error?: string;
  details?: string;
}

// Validate Paystack API keys
async function validatePaystack(secretKey: string): Promise<ValidationResponse> {
  try {
    console.log("Validating Paystack secret key...");
    
    const response = await fetch("https://api.paystack.co/bank", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    console.log("Paystack validation response status:", response.status);

    if (response.status === 401) {
      return {
        isValid: false,
        error: "Invalid Paystack API key",
        details: "The secret key provided is not valid. Please check your Paystack dashboard for the correct key.",
      };
    }

    if (data.status === true) {
      return { isValid: true };
    }

    return {
      isValid: false,
      error: data.message || "Failed to validate Paystack key",
    };
  } catch (error) {
    console.error("Paystack validation error:", error);
    return {
      isValid: false,
      error: "Failed to connect to Paystack",
      details: error instanceof Error ? error.message : "Network error",
    };
  }
}

// Validate Flutterwave API keys
async function validateFlutterwave(secretKey: string): Promise<ValidationResponse> {
  try {
    console.log("Validating Flutterwave secret key...");
    
    const response = await fetch("https://api.flutterwave.com/v3/banks/NG", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    console.log("Flutterwave validation response status:", response.status);

    if (response.status === 401) {
      return {
        isValid: false,
        error: "Invalid Flutterwave API key",
        details: "The secret key provided is not valid. Please check your Flutterwave dashboard for the correct key.",
      };
    }

    if (data.status === "success") {
      return { isValid: true };
    }

    return {
      isValid: false,
      error: data.message || "Failed to validate Flutterwave key",
    };
  } catch (error) {
    console.error("Flutterwave validation error:", error);
    return {
      isValid: false,
      error: "Failed to connect to Flutterwave",
      details: error instanceof Error ? error.message : "Network error",
    };
  }
}

// Validate M-Pesa Daraja credentials
async function validateMpesaDaraja(
  consumerKey: string,
  consumerSecret: string,
  isLiveMode: boolean
): Promise<ValidationResponse> {
  try {
    console.log("Validating M-Pesa Daraja credentials...");
    
    const baseUrl = isLiveMode 
      ? "https://api.safaricom.co.ke"
      : "https://sandbox.safaricom.co.ke";
    
    const auth = btoa(`${consumerKey}:${consumerSecret}`);
    
    const response = await fetch(
      `${baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
      {
        method: "GET",
        headers: {
          "Authorization": `Basic ${auth}`,
        },
      }
    );

    const data = await response.json();
    console.log("M-Pesa validation response status:", response.status);

    if (response.status === 400 || response.status === 401) {
      return {
        isValid: false,
        error: "Invalid M-Pesa Daraja credentials",
        details: data.errorMessage || "The consumer key or secret is incorrect. Please verify your credentials in the Safaricom Developer Portal.",
      };
    }

    if (data.access_token) {
      return { isValid: true };
    }

    return {
      isValid: false,
      error: data.errorMessage || "Failed to validate M-Pesa credentials",
    };
  } catch (error) {
    console.error("M-Pesa validation error:", error);
    return {
      isValid: false,
      error: "Failed to connect to M-Pesa",
      details: error instanceof Error ? error.message : "Network error",
    };
  }
}

// Validate Pesapal credentials
async function validatePesapal(
  consumerKey: string,
  consumerSecret: string,
  isLiveMode: boolean
): Promise<ValidationResponse> {
  try {
    console.log("Validating Pesapal credentials...");
    
    const baseUrl = isLiveMode
      ? "https://pay.pesapal.com/v3"
      : "https://cybqa.pesapal.com/pesapalv3";
    
    const response = await fetch(`${baseUrl}/api/Auth/RequestToken`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        consumer_key: consumerKey,
        consumer_secret: consumerSecret,
      }),
    });

    const data = await response.json();
    console.log("Pesapal validation response status:", response.status);

    if (response.status === 401 || response.status === 400) {
      return {
        isValid: false,
        error: "Invalid Pesapal credentials",
        details: data.message || "The consumer key or secret is incorrect. Please verify your credentials in the Pesapal dashboard.",
      };
    }

    if (data.token) {
      return { isValid: true };
    }

    return {
      isValid: false,
      error: data.message || data.error || "Failed to validate Pesapal credentials",
    };
  } catch (error) {
    console.error("Pesapal validation error:", error);
    return {
      isValid: false,
      error: "Failed to connect to Pesapal",
      details: error instanceof Error ? error.message : "Network error",
    };
  }
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: ValidationRequest = await req.json();
    const { provider, isLiveMode, publicKey, secretKey, consumerKey, consumerSecret, passkey, tillNumber } = body;

    console.log(`Validating ${provider} credentials, live mode: ${isLiveMode}`);

    let result: ValidationResponse;

    switch (provider) {
      case "paystack":
        if (!secretKey) {
          return new Response(
            JSON.stringify({ isValid: false, error: "Secret key is required for Paystack" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        result = await validatePaystack(secretKey);
        break;

      case "flutterwave":
        if (!secretKey) {
          return new Response(
            JSON.stringify({ isValid: false, error: "Secret key is required for Flutterwave" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        result = await validateFlutterwave(secretKey);
        break;

      case "mpesa_daraja":
        if (!consumerKey || !consumerSecret) {
          return new Response(
            JSON.stringify({ isValid: false, error: "Consumer key and secret are required for M-Pesa" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        result = await validateMpesaDaraja(consumerKey, consumerSecret, isLiveMode);
        break;

      case "pesapal":
        if (!consumerKey || !consumerSecret) {
          return new Response(
            JSON.stringify({ isValid: false, error: "Consumer key and secret are required for Pesapal" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        result = await validatePesapal(consumerKey, consumerSecret, isLiveMode);
        break;

      default:
        // For unsupported gateways, skip validation but log it
        console.log(`No validation implemented for provider: ${provider}`);
        result = { isValid: true };
    }

    console.log(`Validation result for ${provider}:`, result);

    return new Response(
      JSON.stringify(result),
      { 
        status: result.isValid ? 200 : 400, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error("Validation error:", error);
    return new Response(
      JSON.stringify({ 
        isValid: false, 
        error: "Validation failed", 
        details: error instanceof Error ? error.message : "Unknown error" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
