-- Email Templates System for Trunkline Communications

-- Email Templates table to store all email templates
CREATE TABLE email_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  template_type text NOT NULL, -- 'verification', 'gift_invitation', 'auto_gift_approval', etc.
  subject_template text NOT NULL,
  html_template text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  version integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  
  UNIQUE(template_type, version)
);

-- Email Analytics table to track email performance
CREATE TABLE email_analytics (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id uuid REFERENCES email_templates(id),
  template_type text NOT NULL,
  recipient_email text NOT NULL,
  sent_at timestamp with time zone NOT NULL DEFAULT now(),
  opened_at timestamp with time zone,
  clicked_at timestamp with time zone,
  bounced_at timestamp with time zone,
  delivery_status text NOT NULL DEFAULT 'sent', -- 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed'
  resend_message_id text,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Email Queue table for managing email sends
CREATE TABLE email_queue (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id uuid REFERENCES email_templates(id),
  recipient_email text NOT NULL,
  recipient_name text,
  template_variables jsonb DEFAULT '{}',
  scheduled_for timestamp with time zone NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'sent', 'failed'
  attempts integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 3,
  error_message text,
  sent_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Email Preferences table for user communication preferences
CREATE TABLE email_preferences (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  email_type text NOT NULL,
  is_enabled boolean NOT NULL DEFAULT true,
  frequency text DEFAULT 'immediate', -- 'immediate', 'daily', 'weekly', 'never'
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  UNIQUE(user_id, email_type)
);

-- Email Template Variables table for dynamic content
CREATE TABLE email_template_variables (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id uuid REFERENCES email_templates(id),
  variable_name text NOT NULL,
  variable_type text NOT NULL, -- 'string', 'number', 'boolean', 'date', 'url'
  default_value text,
  is_required boolean NOT NULL DEFAULT false,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  
  UNIQUE(template_id, variable_name)
);

-- RLS Policies
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_template_variables ENABLE ROW LEVEL SECURITY;

-- Business admins can manage email templates
CREATE POLICY "Business admins can manage email templates" 
ON email_templates FOR ALL 
USING (is_business_admin(auth.uid()));

-- Business admins can view email analytics
CREATE POLICY "Business admins can view email analytics" 
ON email_analytics FOR SELECT 
USING (is_business_admin(auth.uid()));

-- System can manage email queue
CREATE POLICY "System can manage email queue" 
ON email_queue FOR ALL 
USING (true);

-- Users can manage their own email preferences
CREATE POLICY "Users can manage their own email preferences" 
ON email_preferences FOR ALL 
USING (auth.uid() = user_id);

-- Business admins can view template variables
CREATE POLICY "Business admins can view template variables" 
ON email_template_variables FOR ALL 
USING (is_business_admin(auth.uid()));

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_email_templates_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '';

CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_email_templates_updated_at();

CREATE TRIGGER update_email_queue_updated_at
  BEFORE UPDATE ON email_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_preferences_updated_at
  BEFORE UPDATE ON email_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default email templates
INSERT INTO email_templates (name, template_type, description, subject_template, html_template) VALUES
('Verification Email', 'verification', 'Email verification for new user signups', 'Your Elyphant verification code', '
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
  <div style="text-align: center; margin-bottom: 20px;">
    <h1 style="color: #8a4baf;">Welcome to Elyphant! 🐘</h1>
  </div>
  <p>Hi {{name}},</p>
  <p>Thanks for signing up with Elyphant! We''re excited to have you join our community of gift-givers and wish-makers.</p>
  <p>Here is your verification code:</p>
  <div style="margin: 20px 0; text-align: center;">
    <div style="background-color: #f5f5f5; padding: 15px; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #8a4baf;">
      {{verificationCode}}
    </div>
  </div>
  <p>Enter this code on the signup page to verify your email address and continue creating your account.</p>
  <p>This code will expire in 15 minutes.</p>
  <p>If you didn''t create an account with us, you can safely ignore this email.</p>
  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #6b6b6b; font-size: 12px; text-align: center;">
    <p>&copy; {{currentYear}} Elyphant. All rights reserved.</p>
  </div>
</div>'),

('Gift Invitation', 'gift_invitation', 'Invitation email for gift recipients', 'You''ve been invited to join Elyphant for gift giving!', '
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
  <div style="text-align: center; margin-bottom: 20px;">
    <h1 style="color: #8a4baf;">You''ve got a gift invitation! 🎁</h1>
  </div>
  <p>Hi {{recipientName}},</p>
  <p>{{senderName}} has invited you to join Elyphant, a platform that makes gift-giving thoughtful and effortless.</p>
  <p>{{customMessage}}</p>
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{invitationUrl}}" style="background-color: #8a4baf; color: white; padding: 15px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">
      Accept Invitation
    </a>
  </div>
  <p>Join {{senderName}} and thousands of others who are making gift-giving more meaningful with Elyphant.</p>
  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #6b6b6b; font-size: 12px; text-align: center;">
    <p>&copy; {{currentYear}} Elyphant. All rights reserved.</p>
  </div>
</div>'),

('Auto Gift Approval', 'auto_gift_approval', 'Email requesting approval for automated gift suggestions', 'Nicole has a gift suggestion for {{recipientName}} - Approval needed', '
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
  <div style="text-align: center; margin-bottom: 20px;">
    <h1 style="color: #8a4baf;">Nicole found the perfect gift! 🤖🎁</h1>
  </div>
  <p>Hi {{userName}},</p>
  <p>Nicole, our AI gift assistant, has found what she believes is the perfect gift for {{recipientName}}''s {{occasion}}.</p>
  
  <div style="border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin: 20px 0; background-color: #f9f9f9;">
    <h3 style="margin-top: 0; color: #333;">Gift Suggestion:</h3>
    <p><strong>{{giftName}}</strong></p>
    <p>Price: <strong>${{giftPrice}}</strong></p>
    <p>{{giftDescription}}</p>
    {{#if giftImage}}<img src="{{giftImage}}" alt="{{giftName}}" style="max-width: 200px; border-radius: 4px;">{{/if}}
  </div>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{approveUrl}}" style="background-color: #22c55e; color: white; padding: 15px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-right: 10px;">
      Approve & Send Gift
    </a>
    <a href="{{rejectUrl}}" style="background-color: #ef4444; color: white; padding: 15px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">
      Not This Time
    </a>
  </div>
  
  <p><small>Nicole uses your connection with {{recipientName}} and their preferences to make these suggestions. You can always adjust your auto-gifting settings in your account.</small></p>
  
  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #6b6b6b; font-size: 12px; text-align: center;">
    <p>&copy; {{currentYear}} Elyphant. All rights reserved.</p>
  </div>
</div>');

-- Insert template variables for each template
INSERT INTO email_template_variables (template_id, variable_name, variable_type, is_required, description) 
SELECT id, variable_name, variable_type, is_required, description
FROM email_templates, (VALUES
  ('verification', 'name', 'string', true, 'Recipient name'),
  ('verification', 'verificationCode', 'string', true, 'Email verification code'),
  ('verification', 'currentYear', 'number', true, 'Current year for copyright'),
  ('gift_invitation', 'recipientName', 'string', true, 'Name of gift recipient'),
  ('gift_invitation', 'senderName', 'string', true, 'Name of person sending invitation'),
  ('gift_invitation', 'customMessage', 'string', false, 'Custom message from sender'),
  ('gift_invitation', 'invitationUrl', 'url', true, 'URL to accept invitation'),
  ('gift_invitation', 'currentYear', 'number', true, 'Current year for copyright'),
  ('auto_gift_approval', 'userName', 'string', true, 'Name of user who needs to approve'),
  ('auto_gift_approval', 'recipientName', 'string', true, 'Name of gift recipient'),
  ('auto_gift_approval', 'occasion', 'string', true, 'Gift occasion (birthday, etc)'),
  ('auto_gift_approval', 'giftName', 'string', true, 'Name of suggested gift'),
  ('auto_gift_approval', 'giftPrice', 'number', true, 'Price of suggested gift'),
  ('auto_gift_approval', 'giftDescription', 'string', false, 'Description of suggested gift'),
  ('auto_gift_approval', 'giftImage', 'url', false, 'Image URL of suggested gift'),
  ('auto_gift_approval', 'approveUrl', 'url', true, 'URL to approve the gift'),
  ('auto_gift_approval', 'rejectUrl', 'url', true, 'URL to reject the gift'),
  ('auto_gift_approval', 'currentYear', 'number', true, 'Current year for copyright')
) AS vars(template_type, variable_name, variable_type, is_required, description)
WHERE email_templates.template_type = vars.template_type;