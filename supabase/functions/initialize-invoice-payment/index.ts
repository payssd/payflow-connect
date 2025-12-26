import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaymentRequest {
  invoiceToken: string;
  provider: 'paystack' | 'flutterwave';
  callbackUrl?: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: PaymentRequest = await req.json();
    const { invoiceToken, provider, callbackUrl } = body;

    if (!invoiceToken || !provider) {
      return new Response(
        JSON.stringify({ error: "invoiceToken and provider are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch invoice by public token
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*, customer_name, customer_email, organization_id')
      .eq('public_token', invoiceToken)
      .single();

    if (invoiceError || !invoice) {
      console.error("Invoice fetch error:", invoiceError);
      return new Response(
        JSON.stringify({ error: "Invoice not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if invoice is payable
    const balanceDue = Number(invoice.total) - Number(invoice.amount_paid || 0);
    if (balanceDue <= 0) {
      return new Response(
        JSON.stringify({ error: "Invoice is already paid" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch gateway config for the organization
    const { data: gatewayConfig, error: configError } = await supabase
      .from('payment_gateway_configs')
      .select('*')
      .eq('organization_id', invoice.organization_id)
      .eq('provider', provider)
      .eq('is_enabled', true)
      .single();

    if (configError || !gatewayConfig) {
      console.error("Gateway config error:", configError);
      return new Response(
        JSON.stringify({ error: `${provider} payment gateway is not configured for this organization` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the secret key from Supabase secrets (stored per org)
    // For now, we'll use the global PAYSTACK_SECRET_KEY or FLUTTERWAVE_SECRET_KEY
    // In production, you'd store per-org keys securely
    const secretKey = provider === 'paystack' 
      ? Deno.env.get("PAYSTACK_SECRET_KEY")
      : Deno.env.get("FLUTTERWAVE_SECRET_KEY");

    if (!secretKey) {
      return new Response(
        JSON.stringify({ error: `${provider} secret key not configured` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const reference = `INV-${invoice.invoice_number}-${Date.now()}`;
    const amountInKobo = Math.round(balanceDue * 100); // Convert to smallest currency unit
    const defaultCallback = `${supabaseUrl}/functions/v1/verify-invoice-payment?provider=${provider}`;

    let paymentUrl: string;
    let paymentReference: string;

    if (provider === 'paystack') {
      // Initialize Paystack transaction
      const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: invoice.customer_email || 'customer@example.com',
          amount: amountInKobo,
          reference,
          currency: invoice.currency || 'USD',
          callback_url: callbackUrl || defaultCallback,
          metadata: {
            invoice_id: invoice.id,
            invoice_number: invoice.invoice_number,
            customer_name: invoice.customer_name,
            organization_id: invoice.organization_id,
          },
        }),
      });

      const paystackData = await paystackResponse.json();
      
      if (!paystackData.status) {
        console.error("Paystack error:", paystackData);
        return new Response(
          JSON.stringify({ error: paystackData.message || "Failed to initialize payment" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      paymentUrl = paystackData.data.authorization_url;
      paymentReference = paystackData.data.reference;

    } else {
      // Initialize Flutterwave transaction
      const flutterwaveResponse = await fetch('https://api.flutterwave.com/v3/payments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tx_ref: reference,
          amount: balanceDue,
          currency: invoice.currency || 'USD',
          redirect_url: callbackUrl || defaultCallback,
          customer: {
            email: invoice.customer_email || 'customer@example.com',
            name: invoice.customer_name || 'Customer',
          },
          meta: {
            invoice_id: invoice.id,
            invoice_number: invoice.invoice_number,
            organization_id: invoice.organization_id,
          },
          customizations: {
            title: `Invoice ${invoice.invoice_number}`,
            description: `Payment for invoice ${invoice.invoice_number}`,
          },
        }),
      });

      const flutterwaveData = await flutterwaveResponse.json();
      
      if (flutterwaveData.status !== 'success') {
        console.error("Flutterwave error:", flutterwaveData);
        return new Response(
          JSON.stringify({ error: flutterwaveData.message || "Failed to initialize payment" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      paymentUrl = flutterwaveData.data.link;
      paymentReference = reference;
    }

    console.log(`Payment initialized: ${provider}, ref: ${paymentReference}, invoice: ${invoice.invoice_number}`);

    return new Response(
      JSON.stringify({
        success: true,
        paymentUrl,
        reference: paymentReference,
        provider,
        amount: balanceDue,
        currency: invoice.currency || 'USD',
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
