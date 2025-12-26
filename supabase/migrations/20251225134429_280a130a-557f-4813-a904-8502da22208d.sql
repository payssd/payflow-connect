-- Fix the generate_invoice_public_token function to use extensions schema
CREATE OR REPLACE FUNCTION public.generate_invoice_public_token()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
  IF NEW.public_token IS NULL THEN
    NEW.public_token := encode(extensions.gen_random_bytes(16), 'hex');
  END IF;
  RETURN NEW;
END;
$function$;