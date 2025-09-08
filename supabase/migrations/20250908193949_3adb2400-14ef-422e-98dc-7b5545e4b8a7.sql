-- Profile Completion Email Marketing Campaign Database Extensions

-- Add new email template types for profile completion campaign
INSERT INTO public.email_templates (
  name, 
  template_type, 
  subject_template, 
  html_template, 
  description,
  is_active
) VALUES 
(
  'Profile Reminder Welcome',
  'profile_reminder_welcome',
  'Complete your profile to unlock AI-powered gifting 🎁',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Complete Your Profile</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #333; margin-bottom: 10px;">Welcome to AI-Powered Gifting! 🎁</h1>
    <p style="color: #666; font-size: 16px;">You''re just a few steps away from never missing an important gift again.</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #333; margin-top: 0;">Your Profile is {{completion_percentage}}% Complete</h2>
    <p style="color: #666;">Complete your profile to unlock:</p>
    <ul style="color: #666;">
      <li>✨ AI-powered gift recommendations</li>
      <li>🎯 Automatic gift suggestions for friends</li>
      <li>📅 Smart reminders for important dates</li>
      <li>🤖 Nicole, your personal gifting assistant</li>
    </ul>
  </div>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{dashboard_url}}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Complete Your Profile</a>
  </div>
  
  <div style="color: #888; font-size: 14px; text-align: center; margin-top: 30px;">
    <p>Don''t want these reminders? <a href="{{unsubscribe_url}}" style="color: #667eea;">Update your preferences</a></p>
  </div>
</body>
</html>',
  'Day 1 onboarding email to encourage profile completion',
  true
),
(
  'Profile Reminder Interests',
  'profile_reminder_interests', 
  'Add your interests for better gift recommendations 🎯',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Add Your Interests</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #333; margin-bottom: 10px;">Help us learn about you! 🎯</h1>
    <p style="color: #666; font-size: 16px;">The more we know about your interests, the better our AI can help you find perfect gifts.</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #333; margin-top: 0;">Missing: Your Interests</h2>
    <p style="color: #666;">Adding your interests helps us:</p>
    <ul style="color: #666;">
      <li>🎨 Suggest gifts that match your style</li>
      <li>🔍 Find unique items you''ll love</li>
      <li>💡 Recommend gifts for people with similar interests</li>
      <li>⚡ Speed up the gift selection process</li>
    </ul>
  </div>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{interests_url}}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Add My Interests</a>
  </div>
  
  <div style="color: #888; font-size: 14px; text-align: center; margin-top: 30px;">
    <p>Don''t want these reminders? <a href="{{unsubscribe_url}}" style="color: #667eea;">Update your preferences</a></p>
  </div>
</body>
</html>',
  'Day 3 email focusing on adding interests to profile',
  true
),
(
  'Profile Reminder Events',
  'profile_reminder_events',
  'Set up important dates for automatic gift reminders 📅',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Add Important Dates</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #333; margin-bottom: 10px;">Never forget an important date again! 📅</h1>
    <p style="color: #666; font-size: 16px;">Set up birthdays, anniversaries, and special occasions for automatic reminders.</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #333; margin-top: 0;">Missing: Important Dates</h2>
    <p style="color: #666;">Adding important dates enables:</p>
    <ul style="color: #666;">
      <li>⏰ Automatic gift reminders before events</li>
      <li>🎁 AI-suggested gifts for specific occasions</li>
      <li>📲 Smart notifications at the perfect time</li>
      <li>🤖 Proactive assistance from Nicole AI</li>
    </ul>
  </div>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{events_url}}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Add Important Dates</a>
  </div>
  
  <div style="color: #888; font-size: 14px; text-align: center; margin-top: 30px;">
    <p>Don''t want these reminders? <a href="{{unsubscribe_url}}" style="color: #667eea;">Update your preferences</a></p>
  </div>
</body>
</html>',
  'Day 7 email focusing on adding important dates',
  true
),
(
  'Profile Reminder Final',
  'profile_reminder_final',
  'You''re almost there! Complete your AI-ready profile 🚀',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Complete Your Profile</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #333; margin-bottom: 10px;">You''re {{completion_percentage}}% there! 🚀</h1>
    <p style="color: #666; font-size: 16px;">Just a few more details and you''ll unlock the full power of AI gifting.</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #333; margin-top: 0;">What''s Missing:</h2>
    <div style="color: #666;">
      {{#missing_interests}}<p>• Your interests and hobbies</p>{{/missing_interests}}
      {{#missing_events}}<p>• Important dates and occasions</p>{{/missing_events}}
      {{#missing_address}}<p>• Shipping address for gift deliveries</p>{{/missing_address}}
      {{#missing_preferences}}<p>• Gift preferences and style</p>{{/missing_preferences}}
    </div>
  </div>
  
  <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
    <p style="color: #1976d2; margin: 0; font-weight: bold;">💡 Pro Tip: Users with complete profiles get 3x better gift recommendations!</p>
  </div>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{dashboard_url}}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Complete My Profile Now</a>
  </div>
  
  <div style="color: #888; font-size: 14px; text-align: center; margin-top: 30px;">
    <p>Don''t want these reminders? <a href="{{unsubscribe_url}}" style="color: #667eea;">Update your preferences</a></p>
  </div>
</body>
</html>',
  'Day 14 final nudge email for profile completion',
  true
);

-- Create profile completion analytics table
CREATE TABLE public.profile_completion_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  completion_score INTEGER NOT NULL,
  missing_elements JSONB NOT NULL DEFAULT '[]'::jsonb,
  email_campaign_stage TEXT,
  last_email_sent_at TIMESTAMP WITH TIME ZONE,
  email_opens INTEGER DEFAULT 0,
  email_clicks INTEGER DEFAULT 0,
  profile_updated_after_email BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profile completion analytics
ALTER TABLE public.profile_completion_analytics ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for profile completion analytics
CREATE POLICY "Users can view their own completion analytics"
ON public.profile_completion_analytics
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can manage completion analytics"
ON public.profile_completion_analytics
FOR ALL
USING (true)
WITH CHECK (true);

-- Add profile completion email preference
INSERT INTO public.email_preferences (user_id, email_type, is_enabled, frequency)
SELECT 
  p.id,
  'profile_completion_reminders',
  true,
  'smart_timing'
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.email_preferences ep 
  WHERE ep.user_id = p.id AND ep.email_type = 'profile_completion_reminders'
);

-- Create trigger to update completion analytics when profiles are updated
CREATE OR REPLACE FUNCTION public.update_profile_completion_analytics()
RETURNS TRIGGER AS $$
BEGIN
  -- Mark that profile was updated after email if recent email was sent
  UPDATE public.profile_completion_analytics 
  SET 
    profile_updated_after_email = true,
    updated_at = now()
  WHERE 
    user_id = NEW.id 
    AND last_email_sent_at > (now() - INTERVAL '7 days');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Create trigger on profiles table
CREATE TRIGGER trigger_update_profile_completion_analytics
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_profile_completion_analytics();

-- Create index for performance
CREATE INDEX idx_profile_completion_analytics_user_id ON public.profile_completion_analytics(user_id);
CREATE INDEX idx_profile_completion_analytics_score ON public.profile_completion_analytics(completion_score);
CREATE INDEX idx_profile_completion_analytics_last_email ON public.profile_completion_analytics(last_email_sent_at);