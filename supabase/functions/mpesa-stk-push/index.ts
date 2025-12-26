import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface STKPushRequest {
  invoiceToken: string;
  phoneNumber: string;
  callbackUrl?: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { invoiceToken, phoneNumber, callbackUrl }: STKPushRequest = await req.json();

    if (!invoiceToken || !phoneNumber) {
      return new Response(
        JSON.stringify({ error: "Invoice token and phone number are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Processing STK Push for invoice:", invoiceToken);

    // Get invoice by public token
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select("id, invoice_number, total, organization_id, customer_name, customer_phone, status")
      .eq("public_token", invoiceToken)
      .single();

    if (invoiceError || !invoice) {
      console.error("Invoice not found:", invoiceError);
      return new Response(
        JSON.stringify({ error: "Invoice not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (invoice.status === "paid") {
      return new Response(
        JSON.stringify({ error: "Invoice is already paid" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get M-Pesa Daraja config for the organization
    const { data: mpesaConfig, error: configError } = await supabase
      .from("payment_gateway_configs")
      .select("config, is_active")
      .eq("organization_id", invoice.organization_id)
      .eq("gateway", "mpesa_daraja")
      .single();

    if (configError || !mpesaConfig || !mpesaConfig.is_active) {
      console.error("M-Pesa Daraja not configured:", configError);
      return new Response(
        JSON.stringify({ error: "M-Pesa payments not configured for this organization" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const config = mpesaConfig.config as Record<string, string>;
    const consumerKey = config.consumer_key;
    const consumerSecret = config.consumer_secret;
    const passkey = config.passkey;
    const tillNumber = config.till_number;
    const isLive = config.is_live_mode === "true";

    if (!consumerKey || !consumerSecret || !passkey || !tillNumber) {
      return new Response(
        JSON.stringify({ error: "M-Pesa configuration incomplete" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Determine API URLs based on environment
    const baseUrl = isLive 
      ? "https://api.safaricom.co.ke" 
      : "https://sandbox.safaricom.co.ke";

    // Step 1: Get OAuth access token
    console.log("Getting M-Pesa access token...");
    const authString = btoa(`${consumerKey}:${consumerSecret}`);
    const tokenResponse = await fetch(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
      method: "GET",
      headers: {
        Authorization: `Basic ${authString}`,
      },
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Token fetch failed:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to authenticate with M-Pesa" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    console.log("Access token obtained successfully");

    // Step 2: Format phone number (ensure it starts with 254)
    let formattedPhone = phoneNumber.replace(/\s+/g, "").replace(/^0/, "254").replace(/^\+/, "");
    if (!formattedPhone.startsWith("254")) {
      formattedPhone = "254" + formattedPhone;
    }

    // Step 3: Generate timestamp and password
    const now = new Date();
    const timestamp = now.getFullYear().toString() +
      String(now.getMonth() + 1).padStart(2, "0") +
      String(now.getDate()).padStart(2, "0") +
      String(now.getHours()).padStart(2, "0") +
      String(now.getMinutes()).padStart(2, "0") +
      String(now.getSeconds()).padStart(2, "0");

    // For Till Number (Buy Goods), use shortcode as BusinessShortCode
    const shortcode = tillNumber;
    const password = btoa(`${shortcode}${passkey}${timestamp}`);

    // Step 4: Prepare callback URL
    const webhookUrl = callbackUrl || `${supabaseUrl}/functions/v1/mpesa-callback`;

    // Step 5: Make STK Push request
    const amount = Math.ceil(invoice.total); // M-Pesa requires whole numbers

    const stkPayload = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerBuyGoodsOnline", // For Till Number
      Amount: amount,
      PartyA: formattedPhone,
      PartyB: tillNumber,
      PhoneNumber: formattedPhone,
      CallBackURL: webhookUrl,
      AccountReference: invoice.invoice_number.substring(0, 12), // Max 12 chars
      TransactionDesc: `Payment for ${invoice.invoice_number}`,
    };

    console.log("Sending STK Push request:", JSON.stringify({ ...stkPayload, Password: "[REDACTED]" }));

    const stkResponse = await fetch(`${baseUrl}/mpesa/stkpush/v1/processrequest`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(stkPayload),
    });

    const stkResult = await stkResponse.json();
    console.log("STK Push response:", JSON.stringify(stkResult));

    if (stkResult.ResponseCode !== "0") {
      return new Response(
        JSON.stringify({ 
          error: stkResult.errorMessage || stkResult.ResponseDescription || "STK Push failed",
          details: stkResult
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Store the checkout request ID for callback matching
    const { error: updateError } = await supabase
      .from("invoices")
      .update({ 
        payment_reference: stkResult.CheckoutRequestID,
      })
      .eq("id", invoice.id);

    if (updateError) {
      console.error("Failed to store checkout ID:", updateError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "STK Push sent successfully. Please check your phone to complete payment.",
        checkoutRequestId: stkResult.CheckoutRequestID,
        merchantRequestId: stkResult.MerchantRequestID,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("STK Push error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
