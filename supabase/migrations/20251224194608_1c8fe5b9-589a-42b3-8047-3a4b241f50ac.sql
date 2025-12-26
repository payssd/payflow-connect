-- Drop the existing restrictive INSERT policy
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON public.organizations;

-- Create a PERMISSIVE INSERT policy (default behavior)
CREATE POLICY "Authenticated users can create organizations"
ON public.organizations
FOR INSERT
TO authenticated
WITH CHECK (true);
