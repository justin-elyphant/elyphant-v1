-- Delete older duplicate auto_gifting_rules, keeping the one with payment_method_id or most recent
DELETE FROM auto_gifting_rules
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (
      PARTITION BY user_id, recipient_id, date_type 
      ORDER BY 
        CASE WHEN payment_method_id IS NOT NULL THEN 0 ELSE 1 END,
        created_at DESC
    ) as rn
    FROM auto_gifting_rules
    WHERE is_active = true AND recipient_id IS NOT NULL
  ) duplicates
  WHERE rn > 1
);

-- Add unique constraint to prevent future duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_auto_gift_rule 
ON auto_gifting_rules (user_id, recipient_id, date_type) 
WHERE is_active = true AND recipient_id IS NOT NULL;