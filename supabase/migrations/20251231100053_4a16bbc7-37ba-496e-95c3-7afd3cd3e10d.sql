-- Drop existing SELECT policy
DROP POLICY IF EXISTS "Users can view their own invitations" ON public.list_invitations;

-- Create improved SELECT policy using the security definer function
CREATE POLICY "Users can view their own invitations" 
ON public.list_invitations 
FOR SELECT 
TO authenticated
USING (
  auth.uid() = inviter_id 
  OR invitee_email = public.get_current_user_email()
);