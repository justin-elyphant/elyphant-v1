-- Create connection_nudges table to track nudge history and prevent spam
CREATE TABLE public.connection_nudges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL, -- The user who sent the nudge
  recipient_email TEXT NOT NULL, -- Email of the person being nudged
  recipient_phone TEXT, -- Phone number for SMS nudges (optional)
  connection_id UUID, -- Reference to the pending connection if it exists
  nudge_type TEXT NOT NULL DEFAULT 'manual', -- 'manual' or 'automated'
  nudge_method TEXT NOT NULL DEFAULT 'email', -- 'email', 'sms', or 'both'
  nudge_count INTEGER NOT NULL DEFAULT 1, -- How many times this connection has been nudged
  custom_message TEXT, -- Optional custom message for manual nudges
  delivery_status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'failed', 'bounced'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_nudge_sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  next_nudge_scheduled_at TIMESTAMP WITH TIME ZONE -- For automated nudges
);

-- Enable Row Level Security
ALTER TABLE public.connection_nudges ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own nudges" 
ON public.connection_nudges 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own nudges" 
ON public.connection_nudges 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own nudges" 
ON public.connection_nudges 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_connection_nudges_user_id ON public.connection_nudges(user_id);
CREATE INDEX idx_connection_nudges_recipient_email ON public.connection_nudges(recipient_email);
CREATE INDEX idx_connection_nudges_next_nudge ON public.connection_nudges(next_nudge_scheduled_at) WHERE next_nudge_scheduled_at IS NOT NULL;

-- Create trigger for updated_at
CREATE TRIGGER update_connection_nudges_updated_at
  BEFORE UPDATE ON public.connection_nudges
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to check if user can send nudge (rate limiting)
CREATE OR REPLACE FUNCTION public.can_send_nudge(
  p_user_id UUID,
  p_recipient_email TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_nudges INTEGER;
  last_nudge_date TIMESTAMP WITH TIME ZONE;
  days_since_last_nudge INTEGER;
BEGIN
  -- Get total nudges and last nudge date for this recipient
  SELECT 
    COUNT(*),
    MAX(last_nudge_sent_at)
  INTO total_nudges, last_nudge_date
  FROM public.connection_nudges
  WHERE user_id = p_user_id AND recipient_email = p_recipient_email;
  
  -- If no nudges sent yet, allow
  IF total_nudges = 0 THEN
    RETURN TRUE;
  END IF;
  
  -- Check if max nudges (3) reached
  IF total_nudges >= 3 THEN
    RETURN FALSE;
  END IF;
  
  -- Check if at least 7 days have passed since last nudge
  days_since_last_nudge := EXTRACT(DAY FROM (NOW() - last_nudge_date));
  IF days_since_last_nudge < 7 THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$;

-- Create function to get nudge summary for a recipient
CREATE OR REPLACE FUNCTION public.get_nudge_summary(
  p_user_id UUID,
  p_recipient_email TEXT
) RETURNS TABLE(
  total_nudges INTEGER,
  last_nudge_sent TIMESTAMP WITH TIME ZONE,
  can_nudge BOOLEAN,
  days_until_next_nudge INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  nudge_count INTEGER;
  last_nudge TIMESTAMP WITH TIME ZONE;
  can_send BOOLEAN;
  days_until INTEGER;
BEGIN
  -- Get nudge statistics
  SELECT 
    COUNT(*),
    MAX(last_nudge_sent_at)
  INTO nudge_count, last_nudge
  FROM public.connection_nudges
  WHERE user_id = p_user_id AND recipient_email = p_recipient_email;
  
  -- Check if can send nudge
  can_send := public.can_send_nudge(p_user_id, p_recipient_email);
  
  -- Calculate days until next nudge is allowed
  IF last_nudge IS NOT NULL THEN
    days_until := GREATEST(0, 7 - EXTRACT(DAY FROM (NOW() - last_nudge)));
  ELSE
    days_until := 0;
  END IF;
  
  RETURN QUERY SELECT 
    COALESCE(nudge_count, 0),
    last_nudge,
    can_send,
    days_until::INTEGER;
END;
$$;