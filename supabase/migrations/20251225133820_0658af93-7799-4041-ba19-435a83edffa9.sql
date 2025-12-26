-- Create organization_invitations table
CREATE TABLE public.organization_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email text NOT NULL,
  role org_role NOT NULL DEFAULT 'member',
  invited_by uuid NOT NULL,
  token text NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  status text NOT NULL DEFAULT 'pending',
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '7 days'),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(organization_id, email)
);

-- Enable RLS
ALTER TABLE public.organization_invitations ENABLE ROW LEVEL SECURITY;

-- Members can view invitations in their org
CREATE POLICY "Members can view invitations in their org"
ON public.organization_invitations
FOR SELECT
USING (organization_id IN (SELECT get_user_org_ids(auth.uid())));

-- Owners and admins can create invitations
CREATE POLICY "Owners and admins can create invitations"
ON public.organization_invitations
FOR INSERT
WITH CHECK (get_org_role(auth.uid(), organization_id) = ANY (ARRAY['owner'::org_role, 'admin'::org_role]));

-- Owners and admins can update invitations
CREATE POLICY "Owners and admins can update invitations"
ON public.organization_invitations
FOR UPDATE
USING (get_org_role(auth.uid(), organization_id) = ANY (ARRAY['owner'::org_role, 'admin'::org_role]));

-- Owners and admins can delete invitations
CREATE POLICY "Owners and admins can delete invitations"
ON public.organization_invitations
FOR DELETE
USING (get_org_role(auth.uid(), organization_id) = ANY (ARRAY['owner'::org_role, 'admin'::org_role]));

-- Public can view invitations by token (for accepting)
CREATE POLICY "Anyone can view invitation by token"
ON public.organization_invitations
FOR SELECT
USING (true);

-- Create index for faster token lookups
CREATE INDEX idx_org_invitations_token ON public.organization_invitations(token);
CREATE INDEX idx_org_invitations_email ON public.organization_invitations(email);