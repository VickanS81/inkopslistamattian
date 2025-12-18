-- Create invitations table for email-based list sharing
CREATE TABLE public.list_invitations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    list_id UUID NOT NULL REFERENCES public.shopping_lists(id) ON DELETE CASCADE,
    inviter_id UUID NOT NULL,
    invitee_email TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.list_invitations ENABLE ROW LEVEL SECURITY;

-- Policy: Inviter can create invitations
CREATE POLICY "Users can create invitations for their lists"
ON public.list_invitations
FOR INSERT
WITH CHECK (
    auth.uid() = inviter_id AND 
    EXISTS (SELECT 1 FROM public.shopping_lists WHERE id = list_id AND owner_id = auth.uid())
);

-- Policy: Invitee can view and update their invitations
CREATE POLICY "Users can view invitations sent to their email"
ON public.list_invitations
FOR SELECT
USING (
    auth.uid() = inviter_id OR 
    invitee_email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- Policy: Invitee can update invitation status
CREATE POLICY "Users can update invitations sent to them"
ON public.list_invitations
FOR UPDATE
USING (invitee_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Policy: Inviter can delete their invitations
CREATE POLICY "Users can delete their invitations"
ON public.list_invitations
FOR DELETE
USING (auth.uid() = inviter_id);

-- Create function to check if email has an account
CREATE OR REPLACE FUNCTION public.check_email_exists(email_param TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (SELECT 1 FROM auth.users WHERE email = email_param);
$$;

-- Create function to get pending invitations for current user
CREATE OR REPLACE FUNCTION public.get_pending_invitations()
RETURNS TABLE(
    invitation_id UUID,
    list_id UUID,
    list_name TEXT,
    inviter_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        li.id as invitation_id,
        li.list_id,
        sl.name as list_name,
        COALESCE(p.display_name, 'Någon') as inviter_name,
        li.created_at
    FROM public.list_invitations li
    JOIN public.shopping_lists sl ON sl.id = li.list_id
    LEFT JOIN public.profiles p ON p.user_id = li.inviter_id
    WHERE li.invitee_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND li.status = 'pending';
END;
$$;

-- Enable realtime for invitations
ALTER PUBLICATION supabase_realtime ADD TABLE public.list_invitations;