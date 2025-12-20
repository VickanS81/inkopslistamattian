-- Create table for user API keys
CREATE TABLE public.user_api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  api_key text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_api_keys ENABLE ROW LEVEL SECURITY;

-- Users can view their own API key
CREATE POLICY "Users can view their own API key"
ON public.user_api_keys
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own API key
CREATE POLICY "Users can insert their own API key"
ON public.user_api_keys
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own API key (to regenerate)
CREATE POLICY "Users can delete their own API key"
ON public.user_api_keys
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for fast API key lookups
CREATE INDEX idx_user_api_keys_api_key ON public.user_api_keys(api_key);