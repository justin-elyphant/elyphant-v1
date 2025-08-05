-- Create approval_conversations table for Nicole chat approvals
CREATE TABLE public.approval_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  execution_id UUID NOT NULL,
  approval_token_id UUID NOT NULL REFERENCES public.email_approval_tokens(id),
  conversation_data JSONB NOT NULL DEFAULT '{}',
  ai_agent_source JSONB NOT NULL DEFAULT '{"agent": "nicole", "confidence_score": 0}',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  approval_decision TEXT CHECK (approval_decision IN ('approved', 'rejected', 'pending'))
);

-- Enable RLS
ALTER TABLE public.approval_conversations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own approval conversations"
ON public.approval_conversations
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own approval conversations"
ON public.approval_conversations
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own approval conversations"
ON public.approval_conversations
FOR UPDATE
USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_approval_conversations_user_id ON public.approval_conversations(user_id);
CREATE INDEX idx_approval_conversations_execution_id ON public.approval_conversations(execution_id);
CREATE INDEX idx_approval_conversations_status ON public.approval_conversations(status);

-- Create trigger for updated_at
CREATE TRIGGER update_approval_conversations_updated_at
  BEFORE UPDATE ON public.approval_conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();