-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Users can view profiles of list members" ON public.profiles;

-- Create a more restrictive policy: users can only view their own profile
-- or profiles of users they share a list with
CREATE POLICY "Users can view own and shared list member profiles" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() = user_id
  OR EXISTS (
    -- Check if both users are members/owners of the same list
    SELECT 1 FROM public.shopping_lists sl
    WHERE (sl.owner_id = profiles.user_id OR EXISTS (
      SELECT 1 FROM public.list_members lm WHERE lm.list_id = sl.id AND lm.user_id = profiles.user_id
    ))
    AND (sl.owner_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.list_members lm WHERE lm.list_id = sl.id AND lm.user_id = auth.uid()
    ))
  )
);