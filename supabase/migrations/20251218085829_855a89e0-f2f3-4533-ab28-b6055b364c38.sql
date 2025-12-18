-- Add hidden_default_categories column to track which default categories are hidden
ALTER TABLE public.category_order 
ADD COLUMN hidden_default_categories TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];