-- One-time fix: Add recipient name to Justin's auto-gift order shipping_address
UPDATE orders 
SET shipping_address = jsonb_set(
  shipping_address, 
  '{name}', 
  '"Justin Meeks"'
),
status = 'payment_confirmed',
funding_hold_reason = NULL,
updated_at = NOW()
WHERE id = '7cc03e10-0c00-458a-860a-e937a1850d8f';