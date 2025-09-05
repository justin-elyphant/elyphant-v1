-- Enable real-time for messages table
ALTER TABLE public.messages REPLICA IDENTITY FULL;

-- Add messages table to realtime publication if not already added
-- This will allow real-time updates for message notifications
DO $$
BEGIN
    -- Add the table to the realtime publication
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
    EXCEPTION 
        WHEN others THEN
            -- Table might already be in publication, continue
            NULL;
    END;
END $$;