import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SubscriptionEmailRequest {
  email: string;
  organizationName: string;
  type: 'activated' | 'cancelled' | 'payment_failed' | 'renewed';
  planName?: string;
  amount?: number;
  nextBillingDate?: string;
}

const getEmailContent = (data: SubscriptionEmailRequest) => {
  const { type, organizationName, planName, amount, nextBillingDate } = data;

  switch (type) {
    case 'activated':
      return {
        subject: '🎉 Welcome to PayFlow Pro!',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5; margin: 0; padding: 40px 20px;">
            <div style="max-width: 560px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 32px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px;">Subscription Activated!</h1>
              </div>
              <div style="padding: 32px;">
                <p style="color: #374151; font-size: 16px; line-height: 1.6;">Hello ${organizationName},</p>
                <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                  Your <strong>${planName || 'subscription'}</strong> plan has been successfully activated. You now have full access to all premium features!
                </p>
                ${amount ? `<p style="color: #374151; font-size: 16px; line-height: 1.6;">Amount paid: <strong>$${amount.toFixed(2)} USD</strong></p>` : ''}
                ${nextBillingDate ? `<p style="color: #374151; font-size: 16px; line-height: 1.6;">Next billing date: <strong>${nextBillingDate}</strong></p>` : ''}
                <div style="margin-top: 24px; padding: 16px; background: #f0fdf4; border-radius: 8px; border-left: 4px solid #10b981;">
                  <p style="color: #166534; margin: 0; font-size: 14px;">
                    ✓ Unlimited invoices<br>
                    ✓ Advanced reports<br>
                    ✓ Priority support
                  </p>
                </div>
                <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
                  Thank you for choosing PayFlow!
                </p>
              </div>
              <div style="background: #f9fafb; padding: 20px 32px; text-align: center;">
                <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                  PayFlow Africa • <a href="mailto:support@payflow.africa" style="color: #6b7280;">support@payflow.africa</a>
                </p>
              </div>
            </div>
          </body>
          </html>
        `,
      };

    case 'cancelled':
      return {
        subject: 'Your PayFlow subscription has been cancelled',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5; margin: 0; padding: 40px 20px;">
            <div style="max-width: 560px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <div style="background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); padding: 32px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px;">Subscription Cancelled</h1>
              </div>
              <div style="padding: 32px;">
                <p style="color: #374151; font-size: 16px; line-height: 1.6;">Hello ${organizationName},</p>
                <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                  Your subscription has been cancelled. We're sorry to see you go!
                </p>
                <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                  Your access to premium features has ended. You can reactivate your subscription at any time to regain access.
                </p>
                <div style="margin-top: 24px; text-align: center;">
                  <a href="https://payflow.africa/settings/subscription" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                    Reactivate Subscription
                  </a>
                </div>
                <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
                  If you have any feedback about why you cancelled, we'd love to hear from you.
                </p>
              </div>
              <div style="background: #f9fafb; padding: 20px 32px; text-align: center;">
                <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                  PayFlow Africa • <a href="mailto:support@payflow.africa" style="color: #6b7280;">support@payflow.africa</a>
                </p>
              </div>
            </div>
          </body>
          </html>
        `,
      };

    case 'payment_failed':
      return {
        subject: '⚠️ Payment Failed - Action Required',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5; margin: 0; padding: 40px 20px;">
            <div style="max-width: 560px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 32px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px;">Payment Failed</h1>
              </div>
              <div style="padding: 32px;">
                <p style="color: #374151; font-size: 16px; line-height: 1.6;">Hello ${organizationName},</p>
                <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                  We were unable to process your subscription payment. Please update your payment method to avoid service interruption.
                </p>
                <div style="margin-top: 24px; padding: 16px; background: #fef2f2; border-radius: 8px; border-left: 4px solid #ef4444;">
                  <p style="color: #991b1b; margin: 0; font-size: 14px;">
                    Your subscription may be suspended if payment is not received within 3 days.
                  </p>
                </div>
                <div style="margin-top: 24px; text-align: center;">
                  <a href="mailto:support@payflow.africa" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                    Update Payment Method
                  </a>
                </div>
              </div>
              <div style="background: #f9fafb; padding: 20px 32px; text-align: center;">
                <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                  PayFlow Africa • <a href="mailto:support@payflow.africa" style="color: #6b7280;">support@payflow.africa</a>
                </p>
              </div>
            </div>
          </body>
          </html>
        `,
      };

    case 'renewed':
      return {
        subject: '✅ Subscription Renewed Successfully',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5; margin: 0; padding: 40px 20px;">
            <div style="max-width: 560px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 32px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px;">Subscription Renewed</h1>
              </div>
              <div style="padding: 32px;">
                <p style="color: #374151; font-size: 16px; line-height: 1.6;">Hello ${organizationName},</p>
                <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                  Your subscription has been renewed successfully!
                </p>
                ${amount ? `<p style="color: #374151; font-size: 16px; line-height: 1.6;">Amount charged: <strong>$${amount.toFixed(2)} USD</strong></p>` : ''}
                ${nextBillingDate ? `<p style="color: #374151; font-size: 16px; line-height: 1.6;">Next billing date: <strong>${nextBillingDate}</strong></p>` : ''}
                <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
                  Thank you for your continued trust in PayFlow!
                </p>
              </div>
              <div style="background: #f9fafb; padding: 20px 32px; text-align: center;">
                <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                  PayFlow Africa • <a href="mailto:support@payflow.africa" style="color: #6b7280;">support@payflow.africa</a>
                </p>
              </div>
            </div>
          </body>
          </html>
        `,
      };

    default:
      return { subject: 'PayFlow Subscription Update', html: '<p>Your subscription has been updated.</p>' };
  }
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: SubscriptionEmailRequest = await req.json();
    console.log('Sending subscription email:', data.type, 'to:', data.email);

    const { subject, html } = getEmailContent(data);

    const emailResponse = await resend.emails.send({
      from: "PayFlow <notifications@resend.dev>",
      to: [data.email],
      subject,
      html,
    });

    console.log("Subscription email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, ...emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending subscription email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
