import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvitationRequest {
  email: string;
  role: "owner" | "admin" | "member";
  organizationId: string;
}

serve(async (req: Request): Promise<Response> => {
  console.log("send-team-invitation function called");
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(JSON.stringify({ error: "Email service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    const resend = new Resend(resendApiKey);
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Checking authorization...");
    
    // Get the user from the authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("No authorization header");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error("Auth error:", userError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("User authenticated:", user.id);

    const { email, role, organizationId }: InvitationRequest = await req.json();

    console.log("Processing invitation request:", { email, role, organizationId, invitedBy: user.id });

    // Get organization details
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .select("name")
      .eq("id", organizationId)
      .single();

    if (orgError || !org) {
      console.error("Organization error:", orgError);
      return new Response(JSON.stringify({ error: "Organization not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if invitation already exists
    const { data: existingInvitation } = await supabase
      .from("organization_invitations")
      .select("id, status")
      .eq("organization_id", organizationId)
      .eq("email", email.toLowerCase())
      .maybeSingle();

    if (existingInvitation && existingInvitation.status === "pending") {
      return new Response(JSON.stringify({ error: "An invitation has already been sent to this email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if user is already a member
    const { data: existingUser } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("email", email.toLowerCase())
      .maybeSingle();

    if (existingUser) {
      const { data: existingMember } = await supabase
        .from("organization_members")
        .select("id")
        .eq("organization_id", organizationId)
        .eq("user_id", existingUser.user_id)
        .maybeSingle();

      if (existingMember) {
        return new Response(JSON.stringify({ error: "This user is already a member of the organization" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Create invitation
    const { data: invitation, error: inviteError } = await supabase
      .from("organization_invitations")
      .upsert({
        organization_id: organizationId,
        email: email.toLowerCase(),
        role,
        invited_by: user.id,
        status: "pending",
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      }, {
        onConflict: "organization_id,email",
      })
      .select()
      .single();

    if (inviteError) {
      console.error("Invitation creation error:", inviteError);
      return new Response(JSON.stringify({ error: "Failed to create invitation" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Invitation created:", invitation);

    // Get inviter's profile
    const { data: inviterProfile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("user_id", user.id)
      .maybeSingle();

    const inviterName = inviterProfile?.full_name || inviterProfile?.email || "A team member";

    // Build invitation URL
    const siteUrl = Deno.env.get("SITE_URL") || "https://hesabpay.lovable.app";
    const invitationUrl = `${siteUrl}/accept-invitation?token=${invitation.token}`;

    // Send email
    const emailResponse = await resend.emails.send({
      from: "HesabPay <onboarding@resend.dev>",
      to: [email],
      subject: `You've been invited to join ${org.name} on HesabPay`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">HesabPay</h1>
          </div>
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
            <h2 style="color: #1e3a5f; margin-top: 0;">You're Invited! 🎉</h2>
            <p style="font-size: 16px;">${inviterName} has invited you to join <strong>${org.name}</strong> on HesabPay as a <strong>${role}</strong>.</p>
            <p style="font-size: 14px; color: #666;">HesabPay is an all-in-one financial management platform for invoicing, payroll, and expense tracking.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${invitationUrl}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">Accept Invitation</a>
            </div>
            <p style="font-size: 12px; color: #888;">This invitation will expire in 7 days. If you didn't expect this email, you can safely ignore it.</p>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, invitation }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in send-team-invitation function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
