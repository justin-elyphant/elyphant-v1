-- Phase 2: Enhanced Database Schema for Live Order Timeline
-- Add columns to store Zinc timeline events and merchant tracking data

-- Add zinc_timeline_events column to store structured timeline with real timestamps
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS zinc_timeline_events JSONB DEFAULT '[]'::jsonb;

-- Add merchant_tracking_data column for tracking URLs and carrier info
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS merchant_tracking_data JSONB DEFAULT '{}'::jsonb;

-- Add last_zinc_update timestamp to track when we last received updates
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS last_zinc_update TIMESTAMP WITH TIME ZONE;

-- Add index for better performance on zinc timeline queries
CREATE INDEX IF NOT EXISTS idx_orders_zinc_timeline_events ON public.orders USING gin(zinc_timeline_events);
CREATE INDEX IF NOT EXISTS idx_orders_merchant_tracking ON public.orders USING gin(merchant_tracking_data);
CREATE INDEX IF NOT EXISTS idx_orders_last_zinc_update ON public.orders(last_zinc_update);

-- Enable real-time updates for enhanced timeline functionality
ALTER TABLE public.orders REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;