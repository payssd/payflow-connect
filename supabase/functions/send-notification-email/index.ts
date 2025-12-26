import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  type: 'invoice_reminder' | 'payroll_notification' | 'payment_received' | 'expense_approved' | 'expense_rejected' | 'expense_submitted';
  to: string;
  data: {
    recipientName?: string;
    invoiceNumber?: string;
    amount?: number;
    dueDate?: string;
    payrollPeriod?: string;
    organizationName?: string;
    currency?: string;
    expenseDescription?: string;
    expenseCategory?: string;
    rejectionReason?: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, to, data }: NotificationRequest = await req.json();

    console.log(`Sending ${type} notification to ${to}`);

    let subject = '';
    let html = '';
    const currency = data.currency || 'USD';

    switch (type) {
      case 'invoice_reminder':
        subject = `Payment Reminder: Invoice ${data.invoiceNumber}`;
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Payment Reminder</h2>
            <p>Dear ${data.recipientName || 'Customer'},</p>
            <p>This is a friendly reminder that Invoice <strong>${data.invoiceNumber}</strong> for <strong>${currency} ${data.amount?.toLocaleString()}</strong> is due on <strong>${data.dueDate}</strong>.</p>
            <p>If you have already made this payment, please disregard this message.</p>
            <p>Thank you for your business!</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="color: #666; font-size: 12px;">${data.organizationName}</p>
          </div>
        `;
        break;

      case 'payroll_notification':
        subject = `Payroll Processed: ${data.payrollPeriod}`;
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Payroll Notification</h2>
            <p>Dear ${data.recipientName || 'Employee'},</p>
            <p>Your salary for the period <strong>${data.payrollPeriod}</strong> has been processed.</p>
            <p><strong>Net Pay: ${currency} ${data.amount?.toLocaleString()}</strong></p>
            <p>The payment will be credited to your registered bank account.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="color: #666; font-size: 12px;">${data.organizationName}</p>
          </div>
        `;
        break;

      case 'payment_received':
        subject = `Payment Received - Invoice ${data.invoiceNumber}`;
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #22c55e;">Payment Received</h2>
            <p>Dear ${data.recipientName || 'Customer'},</p>
            <p>Thank you! We have received your payment of <strong>${currency} ${data.amount?.toLocaleString()}</strong> for Invoice <strong>${data.invoiceNumber}</strong>.</p>
            <p>Thank you for your business!</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="color: #666; font-size: 12px;">${data.organizationName}</p>
          </div>
        `;
        break;

      case 'expense_submitted':
        subject = `New Expense Submitted for Approval`;
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #3b82f6;">New Expense Submitted</h2>
            <p>A new expense has been submitted for approval:</p>
            <ul style="list-style: none; padding: 0;">
              <li><strong>Description:</strong> ${data.expenseDescription}</li>
              <li><strong>Category:</strong> ${data.expenseCategory}</li>
              <li><strong>Amount:</strong> ${currency} ${data.amount?.toLocaleString()}</li>
            </ul>
            <p>Please review and approve or reject this expense.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="color: #666; font-size: 12px;">${data.organizationName}</p>
          </div>
        `;
        break;

      case 'expense_approved':
        subject = `Expense Approved: ${data.expenseDescription}`;
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #22c55e;">Expense Approved</h2>
            <p>Dear ${data.recipientName || 'Team Member'},</p>
            <p>Your expense has been approved:</p>
            <ul style="list-style: none; padding: 0;">
              <li><strong>Description:</strong> ${data.expenseDescription}</li>
              <li><strong>Category:</strong> ${data.expenseCategory}</li>
              <li><strong>Amount:</strong> ${currency} ${data.amount?.toLocaleString()}</li>
            </ul>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="color: #666; font-size: 12px;">${data.organizationName}</p>
          </div>
        `;
        break;

      case 'expense_rejected':
        subject = `Expense Rejected: ${data.expenseDescription}`;
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #ef4444;">Expense Rejected</h2>
            <p>Dear ${data.recipientName || 'Team Member'},</p>
            <p>Your expense has been rejected:</p>
            <ul style="list-style: none; padding: 0;">
              <li><strong>Description:</strong> ${data.expenseDescription}</li>
              <li><strong>Category:</strong> ${data.expenseCategory}</li>
              <li><strong>Amount:</strong> ${currency} ${data.amount?.toLocaleString()}</li>
              ${data.rejectionReason ? `<li><strong>Reason:</strong> ${data.rejectionReason}</li>` : ''}
            </ul>
            <p>Please contact your manager if you have questions.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="color: #666; font-size: 12px;">${data.organizationName}</p>
          </div>
        `;
        break;

      default:
        throw new Error(`Unknown notification type: ${type}`);
    }

    const emailResponse = await resend.emails.send({
      from: `${data.organizationName || 'PayFlow Africa'} <onboarding@resend.dev>`,
      to: [to],
      subject,
      html,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-notification-email function:", error);
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
