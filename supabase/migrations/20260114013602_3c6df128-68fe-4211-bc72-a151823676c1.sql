-- Add stripe_customer_id to payment_methods table for off-session payments
ALTER TABLE payment_methods 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;