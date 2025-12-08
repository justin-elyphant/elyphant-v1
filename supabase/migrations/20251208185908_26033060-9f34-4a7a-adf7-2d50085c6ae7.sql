-- Mark Jacob's order as failed due to pricing bug
UPDATE orders 
SET 
  status = 'failed',
  notes = 'Failed: max_price_exceeded - Product B07RRCQVN1 was cached with $0.00 price, system used $19.99 fallback, actual Amazon price $179.99. Customer needs refund of $31.73.',
  updated_at = now()
WHERE order_number = 'ORD-20251206-7402';