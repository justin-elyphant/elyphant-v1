-- Add gift_message column to auto_gifting_rules table
ALTER TABLE public.auto_gifting_rules 
ADD COLUMN gift_message TEXT;