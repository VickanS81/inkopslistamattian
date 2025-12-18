-- Drop the existing SELECT policy
DROP POLICY IF EXISTS "Users can view invitations sent to their email" ON public.list_invitations;

-- Create a more restrictive policy that explicitly requires authentication
CREATE POLICY "Users can view their own invitations"
ON public.list_invitations
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND (
    auth.uid() = inviter_id 
    OR invitee_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);