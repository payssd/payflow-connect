-- Fix function search path for security
CREATE OR REPLACE FUNCTION generate_invoice_public_token()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.public_token IS NULL THEN
    NEW.public_token := encode(gen_random_bytes(16), 'hex');
  END IF;
  RETURN NEW;
END;
$$;