-- Create temporary giftee profiles table for SMS-based discovery
CREATE TABLE public.temporary_giftee_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number TEXT NOT NULL,
  giftor_user_id UUID NOT NULL,
  recipient_name TEXT,
  relationship TEXT,
  occasion TEXT,
  gift_date DATE,
  sms_conversation_state JSONB DEFAULT '{"phase": "greeting", "responses": []}'::jsonb,
  preferences_collected JSONB DEFAULT '{}'::jsonb,
  is_completed BOOLEAN DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '7 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.temporary_giftee_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Giftors can manage their temporary giftee profiles"
ON public.temporary_giftee_profiles
FOR ALL
USING (auth.uid() = giftor_user_id);

-- Create index for phone number lookups
CREATE INDEX idx_temporary_giftee_profiles_phone ON public.temporary_giftee_profiles(phone_number);

-- Create index for expiration cleanup
CREATE INDEX idx_temporary_giftee_profiles_expires_at ON public.temporary_giftee_profiles(expires_at);

-- Create trigger for updated_at
CREATE TRIGGER update_temporary_giftee_profiles_updated_at
  BEFORE UPDATE ON public.temporary_giftee_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create SMS messages log table
CREATE TABLE public.sms_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  temporary_giftee_id UUID REFERENCES public.temporary_giftee_profiles(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  message_content TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  twilio_message_sid TEXT,
  delivery_status TEXT DEFAULT 'sent',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for SMS messages
ALTER TABLE public.sms_messages ENABLE ROW LEVEL SECURITY;

-- Create policy for SMS messages
CREATE POLICY "Users can view SMS messages for their giftee profiles"
ON public.sms_messages
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.temporary_giftee_profiles tgp
  WHERE tgp.id = sms_messages.temporary_giftee_id
  AND tgp.giftor_user_id = auth.uid()
));

-- Create index for phone number lookups
CREATE INDEX idx_sms_messages_phone ON public.sms_messages(phone_number);
CREATE INDEX idx_sms_messages_temporary_giftee_id ON public.sms_messages(temporary_giftee_id);