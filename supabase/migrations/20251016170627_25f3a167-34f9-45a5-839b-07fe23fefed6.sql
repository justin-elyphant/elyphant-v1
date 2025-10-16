-- Delete test orders that reference the connection
DELETE FROM orders 
WHERE order_number IN (
  'ORD-1760551493462-3707-1',
  'ORD-1760558246621-5732-1', 
  'ORD-1760551493462-3707',
  'ORD-1760558246621-5732'
);

-- Now delete the connection
DELETE FROM user_connections 
WHERE id = '54c33ce7-18a3-44c6-84b2-1069f5f8e8f4';