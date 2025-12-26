-- Create customers table
CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  customer_number TEXT,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  contact_person TEXT,
  address TEXT,
  city TEXT,
  country TEXT DEFAULT 'Kenya',
  tax_pin TEXT,
  payment_terms INTEGER DEFAULT 30,
  notes TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, customer_number)
);

-- Create invoices table
CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  invoice_number TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'partial', 'overdue', 'cancelled')),
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0,
  tax_rate DECIMAL(5, 2) DEFAULT 16,
  tax_amount DECIMAL(12, 2) DEFAULT 0,
  discount_amount DECIMAL(12, 2) DEFAULT 0,
  total DECIMAL(12, 2) NOT NULL DEFAULT 0,
  amount_paid DECIMAL(12, 2) DEFAULT 0,
  currency TEXT DEFAULT 'KES',
  notes TEXT,
  terms TEXT,
  customer_name TEXT,
  customer_email TEXT,
  customer_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, invoice_number)
);

-- Create invoice items table
CREATE TABLE public.invoice_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL DEFAULT 1,
  unit_price DECIMAL(12, 2) NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

-- Customers RLS
CREATE POLICY "Members can view customers in their org"
ON public.customers FOR SELECT
USING (organization_id IN (SELECT get_user_org_ids(auth.uid())));

CREATE POLICY "Owners and admins can insert customers"
ON public.customers FOR INSERT
WITH CHECK (get_org_role(auth.uid(), organization_id) IN ('owner', 'admin'));

CREATE POLICY "Owners and admins can update customers"
ON public.customers FOR UPDATE
USING (get_org_role(auth.uid(), organization_id) IN ('owner', 'admin'));

CREATE POLICY "Owners can delete customers"
ON public.customers FOR DELETE
USING (get_org_role(auth.uid(), organization_id) = 'owner');

-- Invoices RLS
CREATE POLICY "Members can view invoices in their org"
ON public.invoices FOR SELECT
USING (organization_id IN (SELECT get_user_org_ids(auth.uid())));

CREATE POLICY "Owners and admins can insert invoices"
ON public.invoices FOR INSERT
WITH CHECK (get_org_role(auth.uid(), organization_id) IN ('owner', 'admin'));

CREATE POLICY "Owners and admins can update invoices"
ON public.invoices FOR UPDATE
USING (get_org_role(auth.uid(), organization_id) IN ('owner', 'admin'));

CREATE POLICY "Owners can delete invoices"
ON public.invoices FOR DELETE
USING (get_org_role(auth.uid(), organization_id) = 'owner');

-- Invoice Items RLS (via invoice ownership)
CREATE POLICY "Members can view invoice items"
ON public.invoice_items FOR SELECT
USING (invoice_id IN (
  SELECT id FROM public.invoices WHERE organization_id IN (SELECT get_user_org_ids(auth.uid()))
));

CREATE POLICY "Owners and admins can insert invoice items"
ON public.invoice_items FOR INSERT
WITH CHECK (invoice_id IN (
  SELECT id FROM public.invoices WHERE get_org_role(auth.uid(), organization_id) IN ('owner', 'admin')
));

CREATE POLICY "Owners and admins can update invoice items"
ON public.invoice_items FOR UPDATE
USING (invoice_id IN (
  SELECT id FROM public.invoices WHERE get_org_role(auth.uid(), organization_id) IN ('owner', 'admin')
));

CREATE POLICY "Owners and admins can delete invoice items"
ON public.invoice_items FOR DELETE
USING (invoice_id IN (
  SELECT id FROM public.invoices WHERE get_org_role(auth.uid(), organization_id) IN ('owner', 'admin')
));

-- Triggers for updated_at
CREATE TRIGGER update_customers_updated_at
BEFORE UPDATE ON public.customers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_invoices_updated_at
BEFORE UPDATE ON public.invoices
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Indexes
CREATE INDEX idx_customers_organization_id ON public.customers(organization_id);
CREATE INDEX idx_invoices_organization_id ON public.invoices(organization_id);
CREATE INDEX idx_invoices_customer_id ON public.invoices(customer_id);
CREATE INDEX idx_invoices_status ON public.invoices(status);
CREATE INDEX idx_invoice_items_invoice_id ON public.invoice_items(invoice_id);