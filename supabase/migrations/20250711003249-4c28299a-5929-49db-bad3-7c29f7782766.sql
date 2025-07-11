-- Create order_notes table for internal admin comments
CREATE TABLE public.order_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  admin_user_id UUID NOT NULL,
  note_content TEXT NOT NULL,
  note_type TEXT NOT NULL DEFAULT 'general', -- general, support, refund, shipping
  is_internal BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create return_events table for tracking detected returns
CREATE TABLE public.return_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  zinc_order_id TEXT,
  return_status TEXT NOT NULL, -- initiated, processing, completed, rejected
  return_reason TEXT,
  return_items JSONB,
  refund_amount NUMERIC,
  detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create admin_audit_log table for tracking admin actions
CREATE TABLE public.admin_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id UUID NOT NULL,
  action_type TEXT NOT NULL, -- order_update, customer_contact, refund_process, note_add
  target_type TEXT NOT NULL, -- order, customer, product
  target_id UUID NOT NULL,
  action_details JSONB NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.order_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.return_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Create policies for order_notes
CREATE POLICY "Admin users can manage order notes" 
ON public.order_notes 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create policies for return_events
CREATE POLICY "Admin users can view return events" 
ON public.return_events 
FOR SELECT 
USING (true);

CREATE POLICY "System can insert return events" 
ON public.return_events 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admin users can update return events" 
ON public.return_events 
FOR UPDATE 
USING (true);

-- Create policies for admin_audit_log
CREATE POLICY "Admin users can view audit logs" 
ON public.admin_audit_log 
FOR SELECT 
USING (true);

CREATE POLICY "System can insert audit logs" 
ON public.admin_audit_log 
FOR INSERT 
WITH CHECK (true);

-- Add indexes for performance
CREATE INDEX idx_order_notes_order_id ON public.order_notes(order_id);
CREATE INDEX idx_order_notes_created_at ON public.order_notes(created_at);
CREATE INDEX idx_return_events_order_id ON public.return_events(order_id);
CREATE INDEX idx_return_events_zinc_order_id ON public.return_events(zinc_order_id);
CREATE INDEX idx_return_events_detected_at ON public.return_events(detected_at);
CREATE INDEX idx_admin_audit_log_admin_user_id ON public.admin_audit_log(admin_user_id);
CREATE INDEX idx_admin_audit_log_target_id ON public.admin_audit_log(target_id);
CREATE INDEX idx_admin_audit_log_created_at ON public.admin_audit_log(created_at);

-- Create function to update timestamps
CREATE TRIGGER update_order_notes_updated_at
BEFORE UPDATE ON public.order_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_return_events_updated_at
BEFORE UPDATE ON public.return_events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();