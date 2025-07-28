-- Email approval tokens table
CREATE TABLE public.email_approval_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id UUID REFERENCES public.automated_gift_executions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  token TEXT UNIQUE NOT NULL,
  email_sent_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  approved_via TEXT, -- 'email', 'sms', 'dashboard'
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Email delivery tracking
CREATE TABLE public.email_delivery_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id UUID REFERENCES public.email_approval_tokens(id) ON DELETE CASCADE,
  delivery_status TEXT NOT NULL, -- 'sent', 'delivered', 'opened', 'clicked', 'approved', 'rejected'
  event_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_approval_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_delivery_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for email_approval_tokens
CREATE POLICY "Users can view their own approval tokens" 
ON public.email_approval_tokens 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can manage approval tokens" 
ON public.email_approval_tokens 
FOR ALL 
USING (true);

-- RLS policies for email_delivery_logs  
CREATE POLICY "Users can view their token delivery logs"
ON public.email_delivery_logs
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.email_approval_tokens 
  WHERE id = email_delivery_logs.token_id 
  AND user_id = auth.uid()
));

CREATE POLICY "System can manage delivery logs"
ON public.email_delivery_logs
FOR ALL
USING (true);

-- Create updated_at trigger for tokens
CREATE TRIGGER update_email_approval_tokens_updated_at
BEFORE UPDATE ON public.email_approval_tokens
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();