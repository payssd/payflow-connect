-- Drop the old check constraint
ALTER TABLE public.payment_gateway_configs 
DROP CONSTRAINT IF EXISTS payment_gateway_configs_gateway_check;

-- Add new check constraint with all supported gateways
ALTER TABLE public.payment_gateway_configs 
ADD CONSTRAINT payment_gateway_configs_gateway_check 
CHECK (gateway = ANY (ARRAY['paystack'::text, 'mpesa'::text, 'stripe'::text, 'flutterwave'::text, 'manual'::text]));