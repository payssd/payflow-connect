import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting trial reminder check...");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Calculate the date 3 days from now
    const now = new Date();
    const threeDaysFromNow = new Date(now);
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    
    // Get the start and end of that day
    const startOfDay = new Date(threeDaysFromNow);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(threeDaysFromNow);
    endOfDay.setHours(23, 59, 59, 999);

    console.log(`Looking for trials expiring between ${startOfDay.toISOString()} and ${endOfDay.toISOString()}`);

    // Find organizations with trials expiring in 3 days
    const { data: organizations, error: orgError } = await supabase
      .from("organizations")
      .select("id, name, email, subscription_ends_at")
      .eq("subscription_status", "trialing")
      .gte("subscription_ends_at", startOfDay.toISOString())
      .lte("subscription_ends_at", endOfDay.toISOString());

    if (orgError) {
      console.error("Error fetching organizations:", orgError);
      throw orgError;
    }

    console.log(`Found ${organizations?.length || 0} organizations with trials expiring in 3 days`);

    if (!organizations || organizations.length === 0) {
      return new Response(
        JSON.stringify({ message: "No trials expiring in 3 days", sent: 0 }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    let sentCount = 0;
    const errors: string[] = [];

    for (const org of organizations) {
      try {
        const expiryDate = new Date(org.subscription_ends_at);
        const formattedDate = expiryDate.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });

        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #6366f1; margin: 0;">PayFlow Africa</h1>
            </div>
            
            <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px; padding: 24px; margin-bottom: 24px;">
              <h2 style="color: #92400e; margin: 0 0 12px 0;">⏰ Your Trial Expires in 3 Days</h2>
              <p style="color: #78350f; margin: 0; font-size: 16px;">
                Don't lose access to your data and premium features!
              </p>
            </div>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
              Hi <strong>${org.name}</strong>,
            </p>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
              Your free trial will expire on <strong>${formattedDate}</strong>. After this date, you'll lose access to:
            </p>
            
            <ul style="color: #374151; font-size: 16px; line-height: 1.8;">
              <li>📊 Employee payroll management</li>
              <li>📄 Invoice creation and tracking</li>
              <li>💰 Expense management</li>
              <li>📈 Financial reports and analytics</li>
              <li>👥 Team collaboration features</li>
            </ul>
            
            <div style="text-align: center; margin: 32px 0;">
              <a href="https://payflow-africa.lovable.app/subscription" 
                 style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: bold; font-size: 16px;">
                Upgrade Now →
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
              Have questions? Simply reply to this email and our team will be happy to help.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
            
            <p style="color: #9ca3af; font-size: 12px; text-align: center;">
              PayFlow Africa - Simplifying business payments across Africa<br/>
              <a href="https://payflow-africa.lovable.app" style="color: #6366f1;">payflow-africa.lovable.app</a>
            </p>
          </div>
        `;

        const emailResponse = await resend.emails.send({
          from: "PayFlow Africa <onboarding@resend.dev>",
          to: [org.email],
          subject: "⏰ Your PayFlow Trial Expires in 3 Days - Upgrade Now",
          html,
        });

        console.log(`Email sent to ${org.email}:`, emailResponse);
        sentCount++;
      } catch (emailError: any) {
        console.error(`Failed to send email to ${org.email}:`, emailError);
        errors.push(`${org.email}: ${emailError.message}`);
      }
    }

    return new Response(
      JSON.stringify({
        message: `Trial reminder emails sent`,
        sent: sentCount,
        total: organizations.length,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-trial-reminder function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
