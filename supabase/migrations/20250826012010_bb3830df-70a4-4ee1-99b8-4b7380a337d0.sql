-- Add invitation context fields to gift_invitation_analytics table
ALTER TABLE public.gift_invitation_analytics 
ADD COLUMN IF NOT EXISTS invitation_type TEXT DEFAULT 'manual_connection' CHECK (invitation_type IN ('manual_connection', 'auto_gift', 'nicole_initiated')),
ADD COLUMN IF NOT EXISTS source_context TEXT DEFAULT 'manual_invite' CHECK (source_context IN ('checkout_flow', 'scheduled_event', 'manual_invite', 'nicole_conversation')),
ADD COLUMN IF NOT EXISTS completion_redirect_url TEXT,
ADD COLUMN IF NOT EXISTS invited_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_gift_invitation_analytics_type ON public.gift_invitation_analytics(invitation_type);
CREATE INDEX IF NOT EXISTS idx_gift_invitation_analytics_source ON public.gift_invitation_analytics(source_context);

-- Update existing records to have proper defaults
UPDATE public.gift_invitation_analytics 
SET invitation_type = 'manual_connection', source_context = 'manual_invite' 
WHERE invitation_type IS NULL OR source_context IS NULL;