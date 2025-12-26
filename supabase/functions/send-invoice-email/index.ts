import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendInvoiceRequest {
  invoiceId: string;
  recipientEmail: string;
  recipientName: string;
  senderName: string;
  senderEmail: string;
}

interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

const formatCurrency = (amount: number, currency: string = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { invoiceId, recipientEmail, recipientName, senderName, senderEmail }: SendInvoiceRequest = await req.json();

    console.log(`Sending invoice ${invoiceId} to ${recipientEmail}`);

    // Fetch invoice details
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", invoiceId)
      .single();

    if (invoiceError || !invoice) {
      console.error("Error fetching invoice:", invoiceError);
      throw new Error("Invoice not found");
    }

    // Fetch invoice items
    const { data: items, error: itemsError } = await supabase
      .from("invoice_items")
      .select("*")
      .eq("invoice_id", invoiceId);

    if (itemsError) {
      console.error("Error fetching invoice items:", itemsError);
    }

    const invoiceItems: InvoiceItem[] = items || [];
    const currency = invoice.currency || 'USD';

    // Build items HTML
    const itemsHtml = invoiceItems.map((item) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: left;">${item.description}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatCurrency(Number(item.unit_price), currency)}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatCurrency(Number(item.amount), currency)}</td>
      </tr>
    `).join('');

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 20px;">
        
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Invoice ${invoice.invoice_number}</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">From ${senderName}</p>
        </div>
        
        <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
          <p style="margin: 0 0 20px 0;">Dear ${recipientName},</p>
          <p style="margin: 0 0 20px 0;">Please find below the details of your invoice. We appreciate your business!</p>
          
          <div style="background: white; border-radius: 8px; padding: 20px; margin-bottom: 20px; border: 1px solid #e5e7eb;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0;"><strong>Invoice Number:</strong></td>
                <td style="padding: 8px 0; text-align: right;">${invoice.invoice_number}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Issue Date:</strong></td>
                <td style="padding: 8px 0; text-align: right;">${formatDate(invoice.issue_date)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Due Date:</strong></td>
                <td style="padding: 8px 0; text-align: right;">${formatDate(invoice.due_date)}</td>
              </tr>
            </table>
          </div>

          ${invoiceItems.length > 0 ? `
          <div style="background: white; border-radius: 8px; overflow: hidden; margin-bottom: 20px; border: 1px solid #e5e7eb;">
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background: #f3f4f6;">
                  <th style="padding: 12px; text-align: left; font-weight: 600;">Description</th>
                  <th style="padding: 12px; text-align: center; font-weight: 600;">Qty</th>
                  <th style="padding: 12px; text-align: right; font-weight: 600;">Price</th>
                  <th style="padding: 12px; text-align: right; font-weight: 600;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
          </div>
          ` : ''}

          <div style="background: white; border-radius: 8px; padding: 20px; border: 1px solid #e5e7eb;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0;">Subtotal:</td>
                <td style="padding: 8px 0; text-align: right;">${formatCurrency(Number(invoice.subtotal), currency)}</td>
              </tr>
              ${Number(invoice.tax_amount) > 0 ? `
              <tr>
                <td style="padding: 8px 0;">Tax (${invoice.tax_rate}%):</td>
                <td style="padding: 8px 0; text-align: right;">${formatCurrency(Number(invoice.tax_amount), currency)}</td>
              </tr>
              ` : ''}
              ${Number(invoice.discount_amount) > 0 ? `
              <tr>
                <td style="padding: 8px 0;">Discount:</td>
                <td style="padding: 8px 0; text-align: right;">-${formatCurrency(Number(invoice.discount_amount), currency)}</td>
              </tr>
              ` : ''}
              <tr style="border-top: 2px solid #e5e7eb;">
                <td style="padding: 12px 0; font-size: 18px; font-weight: bold;">Total Due:</td>
                <td style="padding: 12px 0; text-align: right; font-size: 18px; font-weight: bold; color: #3b82f6;">${formatCurrency(Number(invoice.total), currency)}</td>
              </tr>
            </table>
          </div>

          ${invoice.notes ? `
          <div style="margin-top: 20px; padding: 15px; background: #fefce8; border-radius: 8px; border: 1px solid #fde047;">
            <strong>Notes:</strong>
            <p style="margin: 8px 0 0 0;">${invoice.notes}</p>
          </div>
          ` : ''}

          ${invoice.terms ? `
          <div style="margin-top: 15px; font-size: 13px; color: #6b7280;">
            <strong>Terms & Conditions:</strong>
            <p style="margin: 8px 0 0 0;">${invoice.terms}</p>
          </div>
          ` : ''}
        </div>
        
        <div style="background: #1f2937; padding: 20px; border-radius: 0 0 12px 12px; text-align: center;">
          <p style="color: #9ca3af; margin: 0; font-size: 14px;">
            Sent by ${senderName} • ${senderEmail}
          </p>
        </div>
        
      </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: `${senderName} <onboarding@resend.dev>`,
      to: [recipientEmail],
      subject: `Invoice ${invoice.invoice_number} from ${senderName}`,
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);

    // Update invoice status to 'sent' if it was draft
    if (invoice.status === 'draft') {
      await supabase
        .from("invoices")
        .update({ status: 'sent' })
        .eq("id", invoiceId);
    }

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending invoice email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
