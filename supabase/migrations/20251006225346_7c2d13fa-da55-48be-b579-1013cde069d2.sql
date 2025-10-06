-- Create payment intents cache for deduplication
CREATE TABLE IF NOT EXISTS public.payment_intents_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  request_fingerprint text NOT NULL,
  stripe_payment_intent_id text NOT NULL,
  amount integer NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '10 minutes')
);

-- Add index for fast lookups
CREATE INDEX IF NOT EXISTS idx_payment_intents_fingerprint ON public.payment_intents_cache(request_fingerprint, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_intents_expires ON public.payment_intents_cache(expires_at);

-- Enable RLS
ALTER TABLE public.payment_intents_cache ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role can manage payment intents cache"
  ON public.payment_intents_cache
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');