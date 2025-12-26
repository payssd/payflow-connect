import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AcceptRequest {
  token: string;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the user from the authorization header
    const authHeader = req.headers.get("Authorization")!;
    const userToken = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(userToken);

    if (userError || !user) {
      console.error("Auth error:", userError);
      return new Response(JSON.stringify({ error: "Unauthorized. Please log in first." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { token }: AcceptRequest = await req.json();

    console.log("Processing invitation acceptance:", { token, userId: user.id });

    // Get the invitation
    const { data: invitation, error: inviteError } = await supabase
      .from("organization_invitations")
      .select("*, organizations(name)")
      .eq("token", token)
      .eq("status", "pending")
      .maybeSingle();

    if (inviteError || !invitation) {
      console.error("Invitation lookup error:", inviteError);
      return new Response(JSON.stringify({ error: "Invalid or expired invitation" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if invitation has expired
    if (new Date(invitation.expires_at) < new Date()) {
      await supabase
        .from("organization_invitations")
        .update({ status: "expired" })
        .eq("id", invitation.id);

      return new Response(JSON.stringify({ error: "This invitation has expired" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify email matches
    if (user.email?.toLowerCase() !== invitation.email.toLowerCase()) {
      return new Response(JSON.stringify({ 
        error: `This invitation was sent to ${invitation.email}. Please log in with that email address.` 
      }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from("organization_members")
      .select("id")
      .eq("organization_id", invitation.organization_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingMember) {
      // Update invitation status
      await supabase
        .from("organization_invitations")
        .update({ status: "accepted" })
        .eq("id", invitation.id);

      return new Response(JSON.stringify({ 
        success: true, 
        message: "You are already a member of this organization",
        organizationId: invitation.organization_id 
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Add user to organization
    const { error: memberError } = await supabase
      .from("organization_members")
      .insert({
        organization_id: invitation.organization_id,
        user_id: user.id,
        role: invitation.role,
      });

    if (memberError) {
      console.error("Member creation error:", memberError);
      return new Response(JSON.stringify({ error: "Failed to add you to the organization" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update invitation status
    await supabase
      .from("organization_invitations")
      .update({ status: "accepted" })
      .eq("id", invitation.id);

    console.log("Invitation accepted successfully:", { userId: user.id, organizationId: invitation.organization_id });

    return new Response(JSON.stringify({ 
      success: true, 
      message: `You have successfully joined ${invitation.organizations?.name || "the organization"}`,
      organizationId: invitation.organization_id 
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in accept-invitation function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
