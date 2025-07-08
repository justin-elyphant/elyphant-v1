-- Create gift_templates table for template management
CREATE TABLE public.gift_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  occasion text NOT NULL,
  budget_range jsonb NOT NULL DEFAULT '{"min": 25, "max": 100}',
  recipient_types text[] NOT NULL DEFAULT '{}',
  preferred_categories text[] NOT NULL DEFAULT '{}',
  default_message text,
  recurring_schedule jsonb DEFAULT '{"enabled": false, "frequency": "yearly", "days_before": 7}',
  connection_filters jsonb DEFAULT '{"relationship_types": [], "min_connection_age": 0}',
  usage_count integer NOT NULL DEFAULT 0,
  last_used timestamp with time zone,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create address_intelligence table for address analysis
CREATE TABLE public.address_intelligence (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  address_hash text NOT NULL,
  analysis jsonb NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, address_hash)
);

-- Enable RLS
ALTER TABLE public.gift_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.address_intelligence ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for gift_templates
CREATE POLICY "Users can manage their own gift templates"
ON public.gift_templates
FOR ALL
USING (auth.uid() = user_id);

-- Create RLS policies for address_intelligence
CREATE POLICY "Users can manage their own address intelligence"
ON public.address_intelligence
FOR ALL
USING (auth.uid() = user_id);

-- Create updated_at trigger for gift_templates
CREATE TRIGGER update_gift_templates_updated_at
BEFORE UPDATE ON public.gift_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create updated_at trigger for address_intelligence
CREATE TRIGGER update_address_intelligence_updated_at
BEFORE UPDATE ON public.address_intelligence
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();