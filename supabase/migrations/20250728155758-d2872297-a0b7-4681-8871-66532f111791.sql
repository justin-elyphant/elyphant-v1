-- Enhanced Nicole Attribution & Visibility System
-- Add Nicole attribution to automated gift executions
ALTER TABLE public.automated_gift_executions 
ADD COLUMN ai_agent_source jsonb DEFAULT '{"agent": "nicole", "discovery_method": null, "confidence_score": 0, "data_sources": []}'::jsonb;

-- Create Nicole discovery log table
CREATE TABLE public.nicole_discovery_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  recipient_id uuid,
  recipient_email text,
  recipient_phone text,
  discovery_trigger text NOT NULL, -- 'proactive_scan', 'manual_request', 'event_detection'
  discovery_status text NOT NULL DEFAULT 'initiated', -- 'initiated', 'contacted', 'data_collected', 'rule_created', 'completed'
  contact_method text, -- 'sms', 'email'
  data_collected jsonb DEFAULT '{"preferences": {}, "interests": [], "budget_hints": [], "conversation_insights": {}}'::jsonb,
  confidence_metrics jsonb DEFAULT '{"preference_confidence": 0, "budget_confidence": 0, "timing_confidence": 0, "overall_score": 0}'::jsonb,
  timeline_events jsonb DEFAULT '[]'::jsonb, -- Array of timestamped events
  related_execution_id uuid,
  related_rule_id uuid,
  conversation_summary text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone
);

-- Enable RLS on Nicole discovery log
ALTER TABLE public.nicole_discovery_log ENABLE ROW LEVEL SECURITY;

-- RLS policies for Nicole discovery log
CREATE POLICY "Users can view their own Nicole discovery logs" 
ON public.nicole_discovery_log 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can manage Nicole discovery logs" 
ON public.nicole_discovery_log 
FOR ALL 
USING (true);

-- Add indexes for better performance
CREATE INDEX idx_nicole_discovery_user_id ON public.nicole_discovery_log(user_id);
CREATE INDEX idx_nicole_discovery_status ON public.nicole_discovery_log(discovery_status);
CREATE INDEX idx_nicole_discovery_created_at ON public.nicole_discovery_log(created_at);

-- Update function to handle Nicole discovery log timestamps
CREATE OR REPLACE FUNCTION public.update_nicole_discovery_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for Nicole discovery log
CREATE TRIGGER update_nicole_discovery_updated_at
BEFORE UPDATE ON public.nicole_discovery_log
FOR EACH ROW
EXECUTE FUNCTION public.update_nicole_discovery_updated_at();