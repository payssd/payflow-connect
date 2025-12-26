import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PesapalAuthResponse {
  token: string;
  expiryDate: string;
  error?: { code: string; message: string };
  status: string;
}

interface PesapalOrderRequest {
  invoiceToken: string;
  callbackUrl?: string;
}

async function getAccessToken(consumerKey: string, consumerSecret: string, isLive: boolean): Promise<string> {
  const baseUrl = isLive 
    ? 'https://pay.pesapal.com/v3' 
    : 'https://cybqa.pesapal.com/pesapalv3';
  
  const response = await fetch(`${baseUrl}/api/Auth/RequestToken`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      consumer_key: consumerKey,
      consumer_secret: consumerSecret,
    }),
  });

  const data: PesapalAuthResponse = await response.json();
  
  if (data.error || data.status !== '200') {
    throw new Error(data.error?.message || 'Failed to authenticate with Pesapal');
  }

  return data.token;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: PesapalOrderRequest = await req.json();
    const { invoiceToken, callbackUrl } = body;

    if (!invoiceToken) {
      return new Response(
        JSON.stringify({ error: 'invoiceToken is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch invoice by public token
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*')
      .eq('public_token', invoiceToken)
      .single();

    if (invoiceError || !invoice) {
      console.error('Invoice fetch error:', invoiceError);
      return new Response(
        JSON.stringify({ error: 'Invoice not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if invoice is payable
    if (invoice.status === 'paid') {
      return new Response(
        JSON.stringify({ error: 'Invoice is already paid' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch gateway config for the organization
    const { data: gatewayConfig, error: configError } = await supabase
      .from('payment_gateway_configs')
      .select('*')
      .eq('organization_id', invoice.organization_id)
      .eq('gateway', 'pesapal')
      .eq('is_active', true)
      .single();

    if (configError || !gatewayConfig) {
      console.error('Gateway config error:', configError);
      return new Response(
        JSON.stringify({ error: 'Pesapal payment gateway is not configured' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const config = gatewayConfig.config as Record<string, string>;
    const consumerKey = config.consumerKey;
    const consumerSecret = config.consumerSecret;
    const isLive = config.isLiveMode === 'true';

    if (!consumerKey || !consumerSecret) {
      return new Response(
        JSON.stringify({ error: 'Pesapal credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get access token
    const accessToken = await getAccessToken(consumerKey, consumerSecret, isLive);
    
    const baseUrl = isLive 
      ? 'https://pay.pesapal.com/v3' 
      : 'https://cybqa.pesapal.com/pesapalv3';

    // Register IPN URL
    const ipnUrl = `${supabaseUrl}/functions/v1/pesapal-ipn`;
    const ipnResponse = await fetch(`${baseUrl}/api/URLSetup/RegisterIPN`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        url: ipnUrl,
        ipn_notification_type: 'POST',
      }),
    });

    const ipnData = await ipnResponse.json();
    console.log('IPN Registration:', ipnData);

    const ipnId = ipnData.ipn_id;
    if (!ipnId) {
      console.error('Failed to register IPN:', ipnData);
      return new Response(
        JSON.stringify({ error: 'Failed to register IPN callback' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Submit order request
    const merchantReference = `INV-${invoice.invoice_number}-${Date.now()}`;
    const orderRequest = {
      id: merchantReference,
      currency: invoice.currency || 'KES',
      amount: Number(invoice.total),
      description: `Payment for Invoice ${invoice.invoice_number}`,
      callback_url: callbackUrl || `${supabaseUrl}/functions/v1/pesapal-callback`,
      notification_id: ipnId,
      billing_address: {
        email_address: invoice.customer_email || 'customer@example.com',
        phone_number: invoice.customer_phone || '',
        first_name: invoice.customer_name?.split(' ')[0] || 'Customer',
        last_name: invoice.customer_name?.split(' ').slice(1).join(' ') || '',
      },
    };

    const orderResponse = await fetch(`${baseUrl}/api/Transactions/SubmitOrderRequest`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(orderRequest),
    });

    const orderData = await orderResponse.json();
    console.log('Order Response:', orderData);

    if (orderData.error) {
      return new Response(
        JSON.stringify({ error: orderData.error.message || 'Failed to create order' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        paymentUrl: orderData.redirect_url,
        reference: orderData.order_tracking_id,
        merchantReference,
        provider: 'pesapal',
        amount: invoice.total,
        currency: invoice.currency || 'KES',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Pesapal initialize error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
