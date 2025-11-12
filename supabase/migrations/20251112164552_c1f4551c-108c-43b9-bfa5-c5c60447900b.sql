-- Fix email_queue RLS policies to allow welcome email insertion during signup

-- Drop any existing policies on email_queue (if any)
DROP POLICY IF EXISTS "Users can insert their own emails" ON email_queue;
DROP POLICY IF EXISTS "Service role can manage email queue" ON email_queue;

-- Allow authenticated users to insert emails for themselves
-- This enables welcome emails during signup
CREATE POLICY "Users can queue emails for themselves"
ON email_queue
FOR INSERT
TO authenticated
WITH CHECK (
  recipient_email = (
    SELECT email 
    FROM auth.users 
    WHERE id = auth.uid()
  )
);

-- Allow users to view their own queued emails
CREATE POLICY "Users can view their own queued emails"
ON email_queue
FOR SELECT
TO authenticated
USING (
  recipient_email = (
    SELECT email 
    FROM auth.users 
    WHERE id = auth.uid()
  )
);

-- Note: Service role bypasses RLS, so the process-email-queue edge function
-- can update email statuses without additional policies