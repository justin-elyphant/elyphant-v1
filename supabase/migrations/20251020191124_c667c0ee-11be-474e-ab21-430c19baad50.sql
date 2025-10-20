-- Add unique constraint on username column to prevent race conditions
ALTER TABLE profiles ADD CONSTRAINT profiles_username_unique UNIQUE (username);