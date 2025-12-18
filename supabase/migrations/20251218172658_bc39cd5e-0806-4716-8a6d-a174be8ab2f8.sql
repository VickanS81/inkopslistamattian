-- Create helper function to get current user's email securely
CREATE OR REPLACE FUNCTION public.get_current_user_email()
RETURNS TEXT
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
    SELECT email FROM auth.users WHERE id = auth.uid();
$$;

-- Drop and recreate the policies to use the helper function
DROP POLICY IF EXISTS "Users can view invitations sent to their email" ON public.list_invitations;
DROP POLICY IF EXISTS "Users can update invitations sent to them" ON public.list_invitations;

-- Recreate SELECT policy using the helper function
CREATE POLICY "Users can view invitations sent to their email"
ON public.list_invitations
FOR SELECT
USING (
    auth.uid() = inviter_id OR
    invitee_email = public.get_current_user_email()
);

-- Recreate UPDATE policy using the helper function
CREATE POLICY "Users can update invitations sent to them"
ON public.list_invitations
FOR UPDATE
USING (invitee_email = public.get_current_user_email());