-- Fix existing orders that stored line_items pricing in cents instead of dollars
-- This is a data correction, not a schema change
UPDATE orders 
SET line_items = jsonb_set(
  jsonb_set(
    jsonb_set(
      jsonb_set(line_items::jsonb, '{subtotal}', to_jsonb(((line_items->>'subtotal')::numeric) / 100)),
      '{shipping}', to_jsonb(((line_items->>'shipping')::numeric) / 100)
    ),
    '{tax}', to_jsonb(COALESCE(((line_items->>'tax')::numeric), 0) / 100)
  ),
  '{gifting_fee}', to_jsonb(((line_items->>'gifting_fee')::numeric) / 100)
)
WHERE line_items->>'subtotal' IS NOT NULL
  AND (line_items->>'subtotal')::numeric > 1000
  AND status != 'pending_payment';