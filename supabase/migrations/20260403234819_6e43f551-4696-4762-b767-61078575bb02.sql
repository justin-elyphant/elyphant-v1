-- Drop the broken trigger that references non-existent order_items table
DROP TRIGGER IF EXISTS trigger_post_purchase_followup ON public.orders;
DROP FUNCTION IF EXISTS queue_post_purchase_followup();

-- Now update the stuck order
UPDATE public.orders 
SET 
  status = 'delivered',
  fulfilled_at = '2026-04-02T19:19:12.000Z',
  tracking_number = 'ZPYAA0015698916YQ',
  notes = jsonb_build_object(
    'zinc_delivery_status', 'Delivered',
    'delivery_proof_image', 'https://objects.zincapi.com/amazon_28465182f85b1a92f22ff036_112-1077462-0955431_delivery_proof.jpg',
    'zinc_tracking_url', 'https://www.amazon.com/progress-tracker/package/ref=ppx_yo_dt_b_track_package?_encoding=UTF8&itemId=kjrjqshnkmsuun&orderId=112-1077462-0955431&packageIndex=0&shipmentId=Dh57dQtM2&vt=YOUR_ORDERS',
    'carrier', 'ZNLOGIC',
    'retailer_tracking_number', 'TBA329835485063',
    'merchant_order_id', '112-1077462-0955431',
    'delivery_detected_via', 'manual_fix'
  ),
  updated_at = now()
WHERE id = '92cefb3b-3328-449a-b960-7cec30b82860';