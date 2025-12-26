-- Add metadata and refund_type columns to refund_requests if they don't exist
ALTER TABLE public.refund_requests ADD COLUMN IF NOT EXISTS metadata jsonb;
ALTER TABLE public.refund_requests ADD COLUMN IF NOT EXISTS refund_type text;

-- Insert refund_approval_required email template for admin notification
INSERT INTO public.email_templates (
  name,
  template_type,
  subject_template,
  html_template,
  description,
  is_active
) 
SELECT 
  'Refund Approval Required',
  'refund_approval_required',
  '🔔 Refund Approval Required - Order #{{order_number}}',
  '<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px}.header{background:#1a1a1a;color:white;padding:20px;text-align:center;border-radius:8px 8px 0 0}.content{background:#f9f9f9;padding:24px;border:1px solid #e0e0e0}.details{background:white;padding:16px;border-radius:8px;margin:16px 0}.amount{font-size:24px;font-weight:bold;color:#DC2626}.btn{display:inline-block;background:#1a1a1a;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;margin-top:16px}.footer{text-align:center;padding:16px;color:#666;font-size:12px}</style></head><body><div class="header"><h1>🔔 Refund Approval Required</h1></div><div class="content"><p>A refund request requires your approval:</p><div class="details"><p><strong>Order:</strong> #{{order_number}}</p><p><strong>Customer:</strong> {{customer_name}} ({{customer_email}})</p><p><strong>Refund Amount:</strong> <span class="amount">${{refund_amount}}</span></p><p><strong>Reason:</strong> {{refund_reason}}</p></div><p>Please review and approve or reject this refund request in Trunkline.</p><a href="{{trunkline_url}}" class="btn">Review in Trunkline</a></div><div class="footer"><p>Elyphant Admin Notification</p></div></body></html>',
  'Admin notification when a refund request requires approval',
  true
WHERE NOT EXISTS (
  SELECT 1 FROM public.email_templates WHERE template_type = 'refund_approval_required'
);

-- Insert refund_processed email template for customer notification
INSERT INTO public.email_templates (
  name,
  template_type,
  subject_template,
  html_template,
  description,
  is_active
) 
SELECT
  'Refund Processed',
  'refund_processed',
  'Your Refund Has Been Processed - Order #{{order_number}}',
  '<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px}.header{background:linear-gradient(135deg,#1a1a1a 0%,#333 100%);color:white;padding:24px;text-align:center;border-radius:8px 8px 0 0}.logo{font-size:28px;font-weight:bold}.content{background:#ffffff;padding:32px;border:1px solid #e0e0e0}.success-icon{font-size:48px;text-align:center;margin-bottom:16px}.amount-box{background:#f0fdf4;border:1px solid #86efac;padding:20px;border-radius:8px;text-align:center;margin:24px 0}.amount{font-size:32px;font-weight:bold;color:#16a34a}.details{background:#f9f9f9;padding:16px;border-radius:8px;margin:16px 0}.cta-section{background:#fef3c7;border:1px solid #fcd34d;padding:20px;border-radius:8px;text-align:center;margin:24px 0}.btn{display:inline-block;background:#DC2626;color:white;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:bold}.footer{text-align:center;padding:20px;color:#666;font-size:12px;border-top:1px solid #e0e0e0}.timeline{color:#666;font-size:14px}</style></head><body><div class="header"><div class="logo">🐘 Elyphant</div></div><div class="content"><div class="success-icon">✅</div><h2 style="text-align:center;margin-bottom:8px">Your Refund Has Been Processed</h2><p style="text-align:center;color:#666">Hi {{customer_name}},</p><div class="amount-box"><p style="margin:0;color:#666">Refund Amount</p><div class="amount">${{refund_amount}}</div><p class="timeline">Please allow 3-5 business days for the refund to appear on your statement.</p></div><div class="details"><p><strong>Order:</strong> #{{order_number}}</p><p><strong>Reason:</strong> {{refund_reason}}</p></div><div class="cta-section"><p style="margin-bottom:16px;font-weight:bold">Ready to find your perfect gift?</p><a href="{{repurchase_url}}" class="btn">Continue Shopping</a></div><p style="text-align:center;color:#666;font-size:14px">We apologize for any inconvenience and appreciate your understanding.</p></div><div class="footer"><p>Questions? Reply to this email or contact support@elyphant.com</p><p>© 2025 Elyphant. All rights reserved.</p></div></body></html>',
  'Customer notification when their refund has been processed, includes repurchase CTA',
  true
WHERE NOT EXISTS (
  SELECT 1 FROM public.email_templates WHERE template_type = 'refund_processed'
);

-- Fix Order #9e6e33: Update status to cancelled
UPDATE public.orders
SET 
  status = 'cancelled',
  updated_at = NOW(),
  notes = jsonb_build_object(
    'cancellation_reason', 'payment',
    'cancelled_at', NOW()::text,
    'zinc_case_info', 'Retailer cancelled due to payment issue. ZMA refunded by Zinc.',
    'awaiting_customer_refund', true
  )
WHERE id = 'a655f5f9-e081-4d53-805c-5f05aa9e6e33';

-- Create pending refund request for Order #9e6e33
INSERT INTO public.refund_requests (
  order_id,
  amount,
  reason,
  status,
  refund_type
) 
SELECT
  'a655f5f9-e081-4d53-805c-5f05aa9e6e33',
  24.96,
  'ZMA refunded by Zinc - retailer cancelled due to payment issue',
  'pending',
  'full'
WHERE NOT EXISTS (
  SELECT 1 FROM public.refund_requests WHERE order_id = 'a655f5f9-e081-4d53-805c-5f05aa9e6e33' AND status = 'pending'
);