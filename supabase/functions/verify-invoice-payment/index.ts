import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const provider = url.searchParams.get('provider') || 'paystack';
    const reference = url.searchParams.get('reference') || url.searchParams.get('trxref');
    const transactionId = url.searchParams.get('transaction_id');

    if (!reference && !transactionId) {
      return new Response(
        JSON.stringify({ error: "Payment reference required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let paymentVerified = false;
    let paymentData: any = null;
    let invoiceId: string | null = null;
    let amountPaid = 0;

    const paystackKey = Deno.env.get("PAYSTACK_SECRET_KEY");
    const flutterwaveKey = Deno.env.get("FLUTTERWAVE_SECRET_KEY");

    if (provider === 'paystack' && reference) {
      // Verify Paystack transaction
      const verifyResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        headers: {
          'Authorization': `Bearer ${paystackKey}`,
        },
      });

      const verifyData = await verifyResponse.json();
      
      if (verifyData.status && verifyData.data.status === 'success') {
        paymentVerified = true;
        paymentData = verifyData.data;
        invoiceId = verifyData.data.metadata?.invoice_id;
        amountPaid = verifyData.data.amount / 100; // Convert from kobo
      }
    } else if (provider === 'flutterwave' && transactionId) {
      // Verify Flutterwave transaction
      const verifyResponse = await fetch(`https://api.flutterwave.com/v3/transactions/${transactionId}/verify`, {
        headers: {
          'Authorization': `Bearer ${flutterwaveKey}`,
        },
      });

      const verifyData = await verifyResponse.json();
      
      if (verifyData.status === 'success' && verifyData.data.status === 'successful') {
        paymentVerified = true;
        paymentData = verifyData.data;
        invoiceId = verifyData.data.meta?.invoice_id;
        amountPaid = verifyData.data.amount;
      }
    }

    if (!paymentVerified || !invoiceId) {
      console.error("Payment verification failed:", { provider, reference, transactionId });
      // Redirect to invoice page with error
      const redirectUrl = `${supabaseUrl.replace('/rest/v1', '')}/invoice/error?message=Payment+verification+failed`;
      return Response.redirect(redirectUrl, 302);
    }

    // Get current invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();

    if (invoiceError || !invoice) {
      console.error("Invoice not found:", invoiceId);
      return new Response(
        JSON.stringify({ error: "Invoice not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Record the payment
    const { error: paymentError } = await supabase
      .from('invoice_payments')
      .insert({
        invoice_id: invoiceId,
        amount: amountPaid,
        payment_method: provider,
        payment_reference: reference || transactionId,
        status: 'completed',
        gateway_response: paymentData,
      });

    if (paymentError) {
      console.error("Error recording payment:", paymentError);
    }

    // Update invoice amount_paid and status
    const newAmountPaid = Number(invoice.amount_paid || 0) + amountPaid;
    const newStatus = newAmountPaid >= Number(invoice.total) ? 'paid' : 'partial';

    const { error: updateError } = await supabase
      .from('invoices')
      .update({
        amount_paid: newAmountPaid,
        status: newStatus,
      })
      .eq('id', invoiceId);

    if (updateError) {
      console.error("Error updating invoice:", updateError);
    }

    console.log(`Payment verified: ${provider}, invoice: ${invoice.invoice_number}, amount: ${amountPaid}`);

    // Redirect back to invoice page with success
    const redirectUrl = `${Deno.env.get("SUPABASE_URL")?.replace('https://', 'https://').replace('.supabase.co', '.lovable.app')}/invoice/${invoice.public_token}?payment=success`;
    
    // For now, return JSON response (can be changed to redirect)
    return new Response(
      JSON.stringify({
        success: true,
        message: "Payment verified successfully",
        invoice: {
          id: invoiceId,
          invoice_number: invoice.invoice_number,
          amount_paid: newAmountPaid,
          status: newStatus,
        },
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
