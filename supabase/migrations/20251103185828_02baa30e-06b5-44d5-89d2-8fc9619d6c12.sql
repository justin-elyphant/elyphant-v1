-- Create user_sessions table for enterprise session management
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token text NOT NULL UNIQUE,
  device_fingerprint text NOT NULL,
  user_agent text,
  ip_address inet,
  location_data jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  last_activity_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL,
  
  CONSTRAINT sessions_expire_check CHECK (expires_at > created_at)
);

-- Create indexes for performance
CREATE INDEX idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX idx_user_sessions_user_active ON public.user_sessions(user_id, is_active, last_activity_at);
CREATE INDEX idx_user_sessions_expires ON public.user_sessions(expires_at) WHERE is_active = true;
CREATE INDEX idx_user_sessions_token ON public.user_sessions(session_token);
CREATE INDEX idx_user_sessions_fingerprint ON public.user_sessions(user_id, device_fingerprint);

-- Enable Row Level Security
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only view/manage their own sessions
CREATE POLICY "Users can view their own sessions"
  ON public.user_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions"
  ON public.user_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
  ON public.user_sessions
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions"
  ON public.user_sessions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Function to automatically update last_activity_at
CREATE OR REPLACE FUNCTION public.update_session_activity()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_activity_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to update activity timestamp
CREATE TRIGGER update_user_sessions_activity
  BEFORE UPDATE ON public.user_sessions
  FOR EACH ROW
  WHEN (OLD.is_active = true AND NEW.is_active = true)
  EXECUTE FUNCTION public.update_session_activity();

-- Function to cleanup expired sessions (for cron job)
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  -- Mark expired sessions as inactive
  UPDATE public.user_sessions
  SET is_active = false
  WHERE expires_at < now() AND is_active = true;
  
  -- Delete sessions older than 90 days
  DELETE FROM public.user_sessions
  WHERE created_at < now() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to get active session count for a user
CREATE OR REPLACE FUNCTION public.get_active_session_count(target_user_id uuid)
RETURNS integer AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::integer
    FROM public.user_sessions
    WHERE user_id = target_user_id
      AND is_active = true
      AND expires_at > now()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to terminate all other sessions for a user (sign out all devices)
CREATE OR REPLACE FUNCTION public.terminate_other_sessions(
  target_user_id uuid,
  current_session_token text
)
RETURNS void AS $$
BEGIN
  UPDATE public.user_sessions
  SET is_active = false
  WHERE user_id = target_user_id
    AND session_token != current_session_token
    AND is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to terminate a specific session
CREATE OR REPLACE FUNCTION public.terminate_session(target_session_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.user_sessions
  SET is_active = false
  WHERE id = target_session_id
    AND user_id = auth.uid()
    AND is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;