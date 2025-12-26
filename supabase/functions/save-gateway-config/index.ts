import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// All supported gateway IDs from the registry
const SUPPORTED_GATEWAYS = [
  // Mobile Money
  'mpesa_daraja', 'airtel_money', 'equitel', 'sasapay', 'tkash',
  // Payment Aggregators
  'paystack', 'flutterwave', 'pesapal', 'cellulant_tingg', 'ipay_africa',
  'jambopay', 'kora', 'dpo_directpay', 'pesaflow', 'xprizo', 'loop_pay',
  'virtualpay', 'pesawise', 'craft_silicon', 'interswitch',
  // Bank Transfers
  'pesalink', 'kenswitch',
  // International
  'dlocal', 'unlimint', 'payu',
  // Developer Tools
  'africastalking',
];

interface GatewayConfigRequest {
  organizationId: string;
  provider: string;
  isEnabled: boolean;
  isLiveMode: boolean;
  // All possible fields from various gateways
  [key: string]: unknown;
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
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!anonKey) {
      console.error("Missing SUPABASE_ANON_KEY");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const supabaseUser = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    console.log("Getting user from auth header...");
    const { data: userData, error: authError } = await supabaseUser.auth.getUser();
    
    if (authError) {
      console.error("Auth error details:", JSON.stringify(authError));
      return new Response(
        JSON.stringify({ error: "Authentication failed: " + authError.message }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const user = userData?.user;
    if (!user) {
      console.error("No user found in session");
      return new Response(
        JSON.stringify({ error: "No authenticated user found" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("User authenticated:", user.id);

    const body: GatewayConfigRequest = await req.json();
    const { organizationId, provider, isEnabled, isLiveMode, ...restConfig } = body;

    console.log("Request body:", { organizationId, provider, isEnabled, isLiveMode });

    if (!organizationId || !provider) {
      console.error("Missing required fields");
      return new Response(
        JSON.stringify({ error: "organizationId and provider are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate provider is in supported list
    if (!SUPPORTED_GATEWAYS.includes(provider)) {
      console.error("Invalid provider:", provider);
      return new Response(
        JSON.stringify({ error: `Invalid provider: ${provider}. Gateway not supported.` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service role for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user is a member of the organization
    const { data: memberData, error: memberError } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .maybeSingle();
    
    console.log("Member check result:", { memberData, memberError });

    if (memberError) {
      console.error("Error checking membership:", memberError);
      return new Response(
        JSON.stringify({ error: "Failed to verify permissions: " + memberError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!memberData || !['owner', 'admin'].includes(memberData.role)) {
      console.error("Permission denied for role:", memberData?.role);
      return new Response(
        JSON.stringify({ error: "Permission denied. Only owners and admins can modify payment settings." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build the config JSON object dynamically based on what's provided
    const configPayload: Record<string, unknown> = {
      is_live_mode: isLiveMode,
    };
    
    const responseConfig: Record<string, unknown> = {
      provider,
      isEnabled,
      isLiveMode,
    };

    // Process all config fields dynamically
    // Identify secret fields that need hints
    const secretFields = ['secretKey', 'consumerSecret', 'passkey', 'webhookSecret', 'ivKey', 'hashKey', 'apiKey', 'xTransKey'];
    
    for (const [key, value] of Object.entries(restConfig)) {
      if (value === undefined || value === null || value === '') continue;
      
      const stringValue = String(value);
      
      // Check if this is a secret field
      if (secretFields.some(sf => key.toLowerCase().includes(sf.toLowerCase()))) {
        // Store actual value for API calls
        configPayload[key] = stringValue;
        // Store hint for display (last 4 chars)
        configPayload[`${key}Hint`] = `****${stringValue.slice(-4)}`;
        responseConfig[`${key}Hint`] = `****${stringValue.slice(-4)}`;
      } else {
        // Non-secret fields - store as-is
        configPayload[key] = stringValue;
        // For public keys, show partial value
        if (key.toLowerCase().includes('public') || key.toLowerCase().includes('key')) {
          responseConfig[key] = stringValue.length > 12 ? `${stringValue.slice(0, 8)}...` : stringValue;
        } else {
          responseConfig[key] = stringValue;
        }
      }
    }

    console.log("Checking for existing gateway config...");

    // Check if config exists
    const { data: existingConfig, error: existingError } = await supabase
      .from('payment_gateway_configs')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('gateway', provider)
      .maybeSingle();

    if (existingError) {
      console.error("Error checking existing config:", existingError);
      return new Response(
        JSON.stringify({ error: "Failed to check existing configuration: " + existingError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let result;
    if (existingConfig) {
      console.log("Updating existing config:", existingConfig.id);
      result = await supabase
        .from('payment_gateway_configs')
        .update({
          is_active: isEnabled,
          config: configPayload,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingConfig.id)
        .select();
    } else {
      console.log("Creating new config for:", provider);
      result = await supabase
        .from('payment_gateway_configs')
        .insert({
          organization_id: organizationId,
          gateway: provider,
          is_active: isEnabled,
          config: configPayload,
        })
        .select();
    }

    console.log("Database operation result:", { data: result.data, error: result.error });

    if (result.error) {
      console.error("Error saving gateway config:", result.error);
      return new Response(
        JSON.stringify({ error: "Failed to save configuration: " + result.error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Gateway config saved for org ${organizationId}, provider: ${provider}, live mode: ${isLiveMode}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Gateway configuration saved successfully",
        config: responseConfig,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Unexpected error:", error);
    const message = error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
