-- Create a function to get list info by share code (for invite flow)
-- This uses SECURITY DEFINER to bypass RLS since the user isn't a member yet
CREATE OR REPLACE FUNCTION public.get_list_invite_info(share_code_param TEXT)
RETURNS TABLE (
  list_id UUID,
  list_name TEXT,
  owner_name TEXT,
  owner_id UUID
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sl.id as list_id,
    sl.name as list_name,
    COALESCE(p.display_name, 'Någon') as owner_name,
    sl.owner_id
  FROM public.shopping_lists sl
  LEFT JOIN public.profiles p ON p.user_id = sl.owner_id
  WHERE sl.share_code = share_code_param;
END;
$$;