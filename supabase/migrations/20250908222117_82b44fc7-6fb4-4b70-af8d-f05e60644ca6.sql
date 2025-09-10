-- Check current auth settings and fix email confirmation flow
-- This will ensure users must verify their email before being able to access protected features

-- First, let's see what email templates we have
SELECT * FROM auth.email_templates WHERE template_type = 'confirmation';

-- Update auth settings to require email confirmation
UPDATE auth.config SET enable_signup = true, email_confirmation_required = true;