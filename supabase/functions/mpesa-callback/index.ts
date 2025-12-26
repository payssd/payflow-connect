import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface STKCallbackMetadata {
  Item: Array<{
    Name: string;
    Value: string | number;
  }>;
}

interface STKCallback {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResultCode: number;
  ResultDesc: string;
  CallbackMetadata?: STKCallbackMetadata;
}

interface CallbackBody {
  Body: {
    stkCallback: STKCallback;
  };
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

    const body: CallbackBody = await req.json();
    console.log("M-Pesa callback received:", JSON.stringify(body));

    const callback = body.Body?.stkCallback;
    if (!callback) {
      console.error("Invalid callback format");
      return new Response(
        JSON.stringify({ ResultCode: 1, ResultDesc: "Invalid callback format" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = callback;

    console.log(`Processing callback for ${CheckoutRequestID}: ResultCode=${ResultCode}, ResultDesc=${ResultDesc}`);

    // Find invoice by checkout request ID (stored in payment_reference)
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select("id, invoice_number, total, organization_id, customer_name, customer_email, status")
      .eq("payment_reference", CheckoutRequestID)
      .single();

    if (invoiceError || !invoice) {
      console.error("Invoice not found for checkout ID:", CheckoutRequestID, invoiceError);
      // Still return success to M-Pesa to prevent retries
      return new Response(
        JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (ResultCode !== 0) {
      console.log(`Payment failed for invoice ${invoice.invoice_number}: ${ResultDesc}`);
      // Payment was cancelled or failed - just acknowledge
      return new Response(
        JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Payment successful - extract metadata
    let mpesaReceiptNumber = "";
    let transactionDate = "";
    let phoneNumber = "";
    let amount = 0;

    if (CallbackMetadata?.Item) {
      for (const item of CallbackMetadata.Item) {
        switch (item.Name) {
          case "MpesaReceiptNumber":
            mpesaReceiptNumber = String(item.Value);
            break;
          case "TransactionDate":
            transactionDate = String(item.Value);
            break;
          case "PhoneNumber":
            phoneNumber = String(item.Value);
            break;
          case "Amount":
            amount = Number(item.Value);
            break;
        }
      }
    }

    console.log(`Payment successful: Receipt=${mpesaReceiptNumber}, Amount=${amount}, Phone=${phoneNumber}`);

    // Check if invoice is already paid
    if (invoice.status === "paid") {
      console.log(`Invoice ${invoice.invoice_number} is already paid`);
      return new Response(
        JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update invoice status
    const paidAmount = amount || invoice.total;
    const newStatus = paidAmount >= invoice.total ? "paid" : "partial";

    const { error: updateError } = await supabase
      .from("invoices")
      .update({
        status: newStatus,
        paid_at: new Date().toISOString(),
        payment_reference: mpesaReceiptNumber || CheckoutRequestID,
      })
      .eq("id", invoice.id);

    if (updateError) {
      console.error("Failed to update invoice:", updateError);
    } else {
      console.log(`Invoice ${invoice.invoice_number} updated to ${newStatus}`);
    }

    // Log the payment (optional - for audit purposes)
    console.log("Payment recorded:", {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoice_number,
      amount: paidAmount,
      mpesaReceipt: mpesaReceiptNumber,
      phone: phoneNumber,
      transactionDate,
    });

    // Return success response to M-Pesa
    return new Response(
      JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Callback processing error:", error);
    // Still return success to prevent M-Pesa retries
    return new Response(
      JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
