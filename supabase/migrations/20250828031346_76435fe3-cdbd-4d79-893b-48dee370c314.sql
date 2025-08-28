-- Create tables for OpenAI Agent Model integration

-- Table for storing OpenAI Assistant IDs
CREATE TABLE IF NOT EXISTS public.ai_assistants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  assistant_id VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for conversation threads
CREATE TABLE IF NOT EXISTS public.conversation_threads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL,
  thread_id VARCHAR(255) NOT NULL UNIQUE,
  user_id UUID,
  assistant_name VARCHAR(255),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for storing recipient preferences analyzed by the agent
CREATE TABLE IF NOT EXISTS public.recipient_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  recipient_name VARCHAR(255) NOT NULL,
  interests TEXT[],
  relationship VARCHAR(255),
  occasion VARCHAR(255),
  budget_range INTEGER[],
  preferences_data JSONB DEFAULT '{}',
  confidence_score DECIMAL(3,2) DEFAULT 0.0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.ai_assistants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipient_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_assistants (read-only for authenticated users)
CREATE POLICY "Authenticated users can view assistants" 
ON public.ai_assistants 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- RLS Policies for conversation_threads
CREATE POLICY "Users can view their own conversation threads" 
ON public.conversation_threads 
FOR SELECT 
USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can create conversation threads" 
ON public.conversation_threads 
FOR INSERT 
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own conversation threads" 
ON public.conversation_threads 
FOR UPDATE 
USING (auth.uid() = user_id OR user_id IS NULL);

-- RLS Policies for recipient_preferences
CREATE POLICY "Users can view their own recipient preferences" 
ON public.recipient_preferences 
FOR SELECT 
USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can create recipient preferences" 
ON public.recipient_preferences 
FOR INSERT 
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own recipient preferences" 
ON public.recipient_preferences 
FOR UPDATE 
USING (auth.uid() = user_id OR user_id IS NULL);

-- Create indexes for better performance
CREATE INDEX idx_conversation_threads_session_id ON public.conversation_threads(session_id);
CREATE INDEX idx_conversation_threads_user_id ON public.conversation_threads(user_id);
CREATE INDEX idx_recipient_preferences_user_id ON public.recipient_preferences(user_id);
CREATE INDEX idx_recipient_preferences_recipient_name ON public.recipient_preferences(recipient_name);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_ai_assistants_updated_at
BEFORE UPDATE ON public.ai_assistants
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_conversation_threads_updated_at
BEFORE UPDATE ON public.conversation_threads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_recipient_preferences_updated_at
BEFORE UPDATE ON public.recipient_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();