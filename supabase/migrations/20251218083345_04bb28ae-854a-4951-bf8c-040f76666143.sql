-- Create custom_categories table for user-created categories per list
CREATE TABLE public.custom_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  list_id UUID NOT NULL REFERENCES public.shopping_lists(id) ON DELETE CASCADE,
  category_id TEXT NOT NULL,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL,
  UNIQUE(list_id, category_id)
);

-- Enable RLS
ALTER TABLE public.custom_categories ENABLE ROW LEVEL SECURITY;

-- RLS policies - members can manage categories
CREATE POLICY "Members can view custom categories"
ON public.custom_categories
FOR SELECT
USING (is_list_member(list_id));

CREATE POLICY "Members can create custom categories"
ON public.custom_categories
FOR INSERT
WITH CHECK (is_list_member(list_id) AND auth.uid() = created_by);

CREATE POLICY "Members can delete custom categories"
ON public.custom_categories
FOR DELETE
USING (is_list_member(list_id));

-- Enable realtime for custom_categories
ALTER PUBLICATION supabase_realtime ADD TABLE public.custom_categories;