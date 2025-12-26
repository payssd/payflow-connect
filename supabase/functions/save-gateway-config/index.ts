import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GatewayConfigRequest {
  organizationId: string;
  provider: 'paystack' | 'flutterwave';
  publicKey: string;
  secretKey: string;
  webhookSecret?: string;
  isEnabled: boolean;
  isLiveMode: boolean;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    console.log("Starting save-gateway-config function");
    
    // Get user token from header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("No authorization header provided");
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create client with user token for auth check
    const supabaseUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("User authenticated:", user.id);

    const body: GatewayConfigRequest = await req.json();
    const { organizationId, provider, publicKey, secretKey, webhookSecret, isEnabled, isLiveMode } = body;

    console.log("Request body:", { organizationId, provider, isEnabled, isLiveMode });

    if (!organizationId || !provider) {
      console.error("Missing required fields");
      return new Response(
        JSON.stringify({ error: "organizationId and provider are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service role for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user has permission (owner or admin)
    const { data: roleData, error: roleError } = await supabase.rpc('get_org_role', {
      _user_id: user.id,
      _org_id: organizationId,
    });
    
    console.log("Role check result:", { roleData, roleError });

    if (roleError) {
      console.error("Error checking role:", roleError);
      return new Response(
        JSON.stringify({ error: "Failed to verify permissions" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!roleData || !['owner', 'admin'].includes(roleData)) {
      console.error("Permission denied for role:", roleData);
      return new Response(
        JSON.stringify({ error: "Permission denied" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Store only hints of secret keys (last 4 chars)
    const secretKeyHint = secretKey ? `****${secretKey.slice(-4)}` : null;
    const webhookSecretHint = webhookSecret ? `****${webhookSecret.slice(-4)}` : null;

    console.log("Upserting gateway config...");

    // Upsert gateway config (public data only)
    const { data: upsertData, error: upsertError } = await supabase
      .from('payment_gateway_configs')
      .upsert({
        organization_id: organizationId,
        provider,
        is_enabled: isEnabled,
        is_live_mode: isLiveMode,
        public_key: publicKey || null,
        secret_key_hint: secretKeyHint,
        webhook_secret_hint: webhookSecretHint,
      }, {
        onConflict: 'organization_id,provider',
      })
      .select();

    console.log("Upsert result:", { upsertData, upsertError });

    if (upsertError) {
      console.error("Error saving gateway config:", upsertError);
      return new Response(
        JSON.stringify({ error: "Failed to save configuration" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Note: In production, secret keys should be stored in a secure vault
    // For now, we'll log that they were received (not the actual values)
    console.log(`Gateway config saved for org ${organizationId}, provider: ${provider}, live mode: ${isLiveMode}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Gateway configuration saved successfully",
        config: {
          provider,
          isEnabled,
          isLiveMode,
          publicKey: publicKey ? `${publicKey.slice(0, 8)}...` : null,
          secretKeyHint,
          webhookSecretHint,
        }
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
