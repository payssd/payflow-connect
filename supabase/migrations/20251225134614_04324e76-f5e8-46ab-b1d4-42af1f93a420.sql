-- Add unique constraint for organization_id and provider on payment_gateway_configs
ALTER TABLE public.payment_gateway_configs 
ADD CONSTRAINT payment_gateway_configs_org_provider_unique 
UNIQUE (organization_id, provider);