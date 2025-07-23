-- Create business_payment_methods table for storing business credit card details
CREATE TABLE public.business_payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_on_card TEXT NOT NULL,
  card_type TEXT NOT NULL,
  last_four TEXT NOT NULL,
  exp_month INTEGER NOT NULL,
  exp_year INTEGER NOT NULL,
  encrypted_number TEXT NOT NULL,
  encrypted_cvv TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.business_payment_methods ENABLE ROW LEVEL SECURITY;

-- Create policies - Only service role can access these (for security)
CREATE POLICY "Service role can manage business payment methods" 
ON public.business_payment_methods 
FOR ALL 
USING (true);

-- Create index for better performance
CREATE INDEX idx_business_payment_methods_is_default ON public.business_payment_methods(is_default) WHERE is_default = true;
CREATE INDEX idx_business_payment_methods_is_active ON public.business_payment_methods(is_active) WHERE is_active = true;

-- Add trigger to update updated_at
CREATE TRIGGER update_business_payment_methods_updated_at
BEFORE UPDATE ON public.business_payment_methods
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();