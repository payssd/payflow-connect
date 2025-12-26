import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PesapalIPN {
  OrderTrackingId: string;
  OrderMerchantReference: string;
  OrderNotificationType: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: PesapalIPN = await req.json();
    console.log('Pesapal IPN received:', body);

    const { OrderTrackingId, OrderMerchantReference, OrderNotificationType } = body;

    if (!OrderTrackingId || !OrderMerchantReference) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract invoice number from merchant reference (format: INV-{invoice_number}-{timestamp})
    const parts = OrderMerchantReference.split('-');
    if (parts.length < 2) {
      console.error('Invalid merchant reference format:', OrderMerchantReference);
      return new Response(
        JSON.stringify({ error: 'Invalid merchant reference' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const invoiceNumber = parts[1];

    // Find the invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*, organization_id')
      .eq('invoice_number', invoiceNumber)
      .single();

    if (invoiceError || !invoice) {
      console.error('Invoice not found:', invoiceNumber, invoiceError);
      return new Response(
        JSON.stringify({ error: 'Invoice not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get gateway config to query transaction status
    const { data: gatewayConfig } = await supabase
      .from('payment_gateway_configs')
      .select('*')
      .eq('organization_id', invoice.organization_id)
      .eq('gateway', 'pesapal')
      .eq('is_active', true)
      .single();

    if (!gatewayConfig) {
      console.error('No gateway config found');
      return new Response(
        JSON.stringify({ status: 'ok', message: 'No gateway config' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const config = gatewayConfig.config as Record<string, string>;
    const isLive = config.isLiveMode === 'true';
    const baseUrl = isLive 
      ? 'https://pay.pesapal.com/v3' 
      : 'https://cybqa.pesapal.com/pesapalv3';

    // Get access token
    const authResponse = await fetch(`${baseUrl}/api/Auth/RequestToken`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        consumer_key: config.consumerKey,
        consumer_secret: config.consumerSecret,
      }),
    });

    const authData = await authResponse.json();
    if (!authData.token) {
      console.error('Failed to get access token');
      return new Response(
        JSON.stringify({ status: 'ok', message: 'Auth failed' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Query transaction status
    const statusResponse = await fetch(
      `${baseUrl}/api/Transactions/GetTransactionStatus?orderTrackingId=${OrderTrackingId}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${authData.token}`,
        },
      }
    );

    const statusData = await statusResponse.json();
    console.log('Transaction status:', statusData);

    // Update invoice if payment is completed
    if (statusData.payment_status_description === 'Completed') {
      const { error: updateError } = await supabase
        .from('invoices')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          payment_reference: OrderTrackingId,
        })
        .eq('id', invoice.id);

      if (updateError) {
        console.error('Failed to update invoice:', updateError);
      } else {
        console.log(`Invoice ${invoiceNumber} marked as paid via Pesapal`);
      }
    }

    // Respond with status OK to acknowledge IPN
    return new Response(
      JSON.stringify({
        orderNotificationType: OrderNotificationType,
        orderTrackingId: OrderTrackingId,
        orderMerchantReference: OrderMerchantReference,
        status: 200,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Pesapal IPN error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
