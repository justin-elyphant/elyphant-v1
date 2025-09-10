-- Update the verification email template to use Supabase's built-in confirmation links instead of 6-digit codes
UPDATE email_templates 
SET 
  html_template = '
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
  <div style="text-align: center; margin-bottom: 20px;">
    <h1 style="color: #8a4baf;">Welcome to Elyphant! 🐘</h1>
  </div>
  <p>Hi {{name}},</p>
  <p>Thanks for signing up with Elyphant! We''re excited to have you join our community of gift-givers and wish-makers.</p>
  <p>To complete your account setup, please click the button below to verify your email address:</p>
  <div style="margin: 30px 0; text-align: center;">
    <a href="{{.ConfirmationURL}}" style="background-color: #8a4baf; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
      Verify My Email Address
    </a>
  </div>
  <p>If the button doesn''t work, you can also copy and paste this link into your browser:</p>
  <p style="word-break: break-all; background-color: #f5f5f5; padding: 10px; border-radius: 3px; font-family: monospace;">
    {{.ConfirmationURL}}
  </p>
  <p>This verification link will expire in 24 hours.</p>
  <p>If you didn''t create an account with us, you can safely ignore this email.</p>
  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #6b6b6b; font-size: 12px; text-align: center;">
    <p>&copy; {{currentYear}} Elyphant. All rights reserved.</p>
  </div>
</div>',
  subject_template = 'Verify your Elyphant account',
  description = 'Email verification with confirmation link for new user signups',
  updated_at = now()
WHERE template_type = 'verification' OR name = 'Verification Email';