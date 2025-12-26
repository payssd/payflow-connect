-- Add mobile money payment fields to employees table
ALTER TABLE public.employees
ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'bank',
ADD COLUMN IF NOT EXISTS mobile_money_provider text,
ADD COLUMN IF NOT EXISTS mobile_money_number text;

-- Add comment for clarity
COMMENT ON COLUMN public.employees.payment_method IS 'Payment method: bank or mobile_money';
COMMENT ON COLUMN public.employees.mobile_money_provider IS 'Mobile money provider: mpesa, airtel_money, tkash';
COMMENT ON COLUMN public.employees.mobile_money_number IS 'Mobile money phone number for payments';