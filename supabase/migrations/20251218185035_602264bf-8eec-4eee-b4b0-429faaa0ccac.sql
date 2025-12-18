-- Enable full replica identity for shopping_items to fix realtime DELETE events
ALTER TABLE public.shopping_items REPLICA IDENTITY FULL;