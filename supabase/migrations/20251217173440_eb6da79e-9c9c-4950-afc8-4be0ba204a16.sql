-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view profiles of list members" 
  ON public.profiles FOR SELECT 
  USING (true);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create shopping lists table
CREATE TABLE public.shopping_lists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'Min lista',
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  share_code TEXT UNIQUE DEFAULT substring(md5(random()::text), 1, 8),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on shopping_lists
ALTER TABLE public.shopping_lists ENABLE ROW LEVEL SECURITY;

-- Create list members table (for sharing)
CREATE TABLE public.list_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  list_id UUID NOT NULL REFERENCES public.shopping_lists(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(list_id, user_id)
);

-- Enable RLS on list_members
ALTER TABLE public.list_members ENABLE ROW LEVEL SECURITY;

-- Create shopping items table
CREATE TABLE public.shopping_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  list_id UUID NOT NULL REFERENCES public.shopping_lists(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity TEXT NOT NULL DEFAULT '1',
  unit TEXT,
  category TEXT NOT NULL DEFAULT 'other',
  checked BOOLEAN NOT NULL DEFAULT false,
  checked_at TIMESTAMP WITH TIME ZONE,
  checked_by UUID REFERENCES auth.users(id),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on shopping_items
ALTER TABLE public.shopping_items ENABLE ROW LEVEL SECURITY;

-- Create category order table (per user per list)
CREATE TABLE public.category_order (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  list_id UUID NOT NULL REFERENCES public.shopping_lists(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_order TEXT[] NOT NULL DEFAULT ARRAY['other', 'vegetables', 'dairy', 'meat', 'fish', 'pantry', 'spices', 'frozen', 'bakery', 'drinks'],
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(list_id, user_id)
);

-- Enable RLS on category_order
ALTER TABLE public.category_order ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is member of list
CREATE OR REPLACE FUNCTION public.is_list_member(list_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.shopping_lists sl
    WHERE sl.id = list_uuid AND sl.owner_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.list_members lm
    WHERE lm.list_id = list_uuid AND lm.user_id = auth.uid()
  )
$$;

-- Shopping lists policies
CREATE POLICY "Users can view their own lists and shared lists" 
  ON public.shopping_lists FOR SELECT 
  USING (public.is_list_member(id) OR owner_id = auth.uid());

CREATE POLICY "Users can create lists" 
  ON public.shopping_lists FOR INSERT 
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their lists" 
  ON public.shopping_lists FOR UPDATE 
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their lists" 
  ON public.shopping_lists FOR DELETE 
  USING (auth.uid() = owner_id);

-- List members policies
CREATE POLICY "Members can view list members" 
  ON public.list_members FOR SELECT 
  USING (public.is_list_member(list_id));

CREATE POLICY "Users can join lists" 
  ON public.list_members FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave lists" 
  ON public.list_members FOR DELETE 
  USING (auth.uid() = user_id);

-- Shopping items policies
CREATE POLICY "Members can view items" 
  ON public.shopping_items FOR SELECT 
  USING (public.is_list_member(list_id));

CREATE POLICY "Members can add items" 
  ON public.shopping_items FOR INSERT 
  WITH CHECK (public.is_list_member(list_id) AND auth.uid() = created_by);

CREATE POLICY "Members can update items" 
  ON public.shopping_items FOR UPDATE 
  USING (public.is_list_member(list_id));

CREATE POLICY "Members can delete items" 
  ON public.shopping_items FOR DELETE 
  USING (public.is_list_member(list_id));

-- Category order policies
CREATE POLICY "Users can view their category order" 
  ON public.category_order FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their category order" 
  ON public.category_order FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their category order" 
  ON public.category_order FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'display_name');
  RETURN NEW;
END;
$$;

-- Create trigger for new users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shopping_lists_updated_at
  BEFORE UPDATE ON public.shopping_lists
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shopping_items_updated_at
  BEFORE UPDATE ON public.shopping_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for shopping_items
ALTER PUBLICATION supabase_realtime ADD TABLE public.shopping_items;