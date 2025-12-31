-- Drop the existing update policy
DROP POLICY IF EXISTS "Users can update invitations sent to them" ON public.list_invitations;

-- Create a new update policy that uses the security definer function properly
CREATE POLICY "Users can update invitations sent to them" 
ON public.list_invitations 
FOR UPDATE 
USING (invitee_email = public.get_current_user_email())
WITH CHECK (invitee_email = public.get_current_user_email());