-- Remove recovery_link column from password_reset_tokens (no longer needed)
ALTER TABLE password_reset_tokens DROP COLUMN IF EXISTS recovery_link;