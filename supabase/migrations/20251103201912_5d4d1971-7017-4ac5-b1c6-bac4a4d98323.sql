
-- Create trusted devices table for device recognition
CREATE TABLE IF NOT EXISTS public.trusted_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_fingerprint text NOT NULL,
  device_name text NOT NULL,
  trusted_at timestamptz DEFAULT now(),
  last_used_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  
  UNIQUE(user_id, device_fingerprint)
);

CREATE INDEX IF NOT EXISTS idx_trusted_devices_user ON public.trusted_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_trusted_devices_fingerprint ON public.trusted_devices(user_id, device_fingerprint);

ALTER TABLE public.trusted_devices ENABLE ROW LEVEL SECURITY;

-- Users can manage their own trusted devices
CREATE POLICY "Users can manage their own trusted devices"
  ON public.trusted_devices
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE public.trusted_devices IS 'Stores trusted devices for users to skip additional security checks';
