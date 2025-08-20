-- Create api_keys table for storing API keys
CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL,
  service TEXT NOT NULL DEFAULT 'zinc',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Create policy for system access only (no user access needed)
CREATE POLICY "System can access API keys" 
ON public.api_keys 
FOR ALL
TO service_role 
USING (true);

-- Insert the Zinc API key (this is the same key being used in get-products)
INSERT INTO public.api_keys (key, service) 
VALUES ('5B394AAF6CD03728E9E33DDF', 'zinc')
ON CONFLICT DO NOTHING;