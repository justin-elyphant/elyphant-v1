-- Add unique constraint on session_id for cart_sessions table
-- This allows proper upsert operations when saving cart data during checkout

ALTER TABLE cart_sessions 
ADD CONSTRAINT cart_sessions_session_id_key UNIQUE (session_id);