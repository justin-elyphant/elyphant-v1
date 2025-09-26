-- Create user_carts table for persistent cart storage
CREATE TABLE public.user_carts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  cart_data jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '30 days'),
  session_id text NULL -- For guest carts if needed
);

-- Enable RLS
ALTER TABLE public.user_carts ENABLE ROW LEVEL SECURITY;

-- Create policies for user cart access
CREATE POLICY "Users can manage their own carts" 
ON public.user_carts 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX idx_user_carts_user_id ON public.user_carts (user_id);
CREATE INDEX idx_user_carts_expires_at ON public.user_carts (expires_at);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_user_carts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_carts_updated_at
BEFORE UPDATE ON public.user_carts
FOR EACH ROW
EXECUTE FUNCTION public.update_user_carts_updated_at();