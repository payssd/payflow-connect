import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");

    if (!token) {
      return new Response(
        JSON.stringify({ error: "Token is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch invoice by public token
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select(`
        *,
        organization:organizations(name, email, phone, country, logo_url),
        items:invoice_items(*)
      `)
      .eq("public_token", token)
      .single();

    if (invoiceError || !invoice) {
      console.error("Error fetching invoice:", invoiceError);
      return new Response(
        JSON.stringify({ error: "Invoice not found or link expired" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch payment settings for the organization
    const { data: paymentSettings } = await supabase
      .from("payment_settings")
      .select("*")
      .eq("organization_id", invoice.organization_id)
      .maybeSingle();

    // Fetch gateway configs to check if online payment is available
    const { data: gatewayConfigs } = await supabase
      .from("payment_gateway_configs")
      .select("provider, is_enabled")
      .eq("organization_id", invoice.organization_id)
      .eq("is_enabled", true);

    const onlinePayment = {
      paystack: gatewayConfigs?.some((c: any) => c.provider === 'paystack') || false,
      flutterwave: gatewayConfigs?.some((c: any) => c.provider === 'flutterwave') || false,
    };

    // Return invoice data (without sensitive organization data)
    return new Response(
      JSON.stringify({
        invoice: {
          id: invoice.id,
          invoice_number: invoice.invoice_number,
          status: invoice.status,
          issue_date: invoice.issue_date,
          due_date: invoice.due_date,
          subtotal: invoice.subtotal,
          tax_rate: invoice.tax_rate,
          tax_amount: invoice.tax_amount,
          discount_amount: invoice.discount_amount,
          total: invoice.total,
          amount_paid: invoice.amount_paid,
          currency: invoice.currency,
          notes: invoice.notes,
          terms: invoice.terms,
          customer_name: invoice.customer_name,
          customer_email: invoice.customer_email,
          customer_address: invoice.customer_address,
        },
        organization: {
          name: invoice.organization?.name,
          email: invoice.organization?.email,
          phone: invoice.organization?.phone,
          country: invoice.organization?.country,
          logo_url: invoice.organization?.logo_url,
        },
        items: invoice.items?.map((item: any) => ({
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          amount: item.amount,
        })),
        paymentMethods: {
          mpesa: paymentSettings?.mpesa_enabled ? {
            shortcode: paymentSettings.mpesa_business_shortcode,
            account_name: paymentSettings.mpesa_account_name,
          } : null,
          bank: paymentSettings?.bank_enabled ? {
            bank_name: paymentSettings.bank_name,
            account_name: paymentSettings.bank_account_name,
            account_number: paymentSettings.bank_account_number,
            branch: paymentSettings.bank_branch,
            swift_code: paymentSettings.bank_swift_code,
          } : null,
        },
        onlinePayment,
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
