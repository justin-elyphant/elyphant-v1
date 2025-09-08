-- Add new email template types for e-commerce
INSERT INTO public.email_templates (name, template_type, subject_template, html_template, description, is_active) VALUES
(
  'Payment Confirmation',
  'payment_confirmation',
  'Payment Confirmed - Order #{{order_number}}',
  '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Confirmed</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Payment Confirmed! 🎉</h1>
    </div>
    
    <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
        <p style="font-size: 18px; margin-bottom: 25px;">Hi {{customer_name}},</p>
        
        <p style="font-size: 16px; margin-bottom: 20px;">Great news! Your payment has been successfully processed for order <strong>#{{order_number}}</strong>.</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #28a745;">
            <h3 style="margin-top: 0; color: #28a745;">Payment Details</h3>
            <p><strong>Order Number:</strong> {{order_number}}</p>
            <p><strong>Amount Paid:</strong> ${{total_amount}}</p>
            <p><strong>Payment Method:</strong> {{payment_method}}</p>
            <p><strong>Transaction ID:</strong> {{transaction_id}}</p>
        </div>
        
        <p style="margin: 25px 0;">Your order is now being prepared for shipment. We''ll send you another email with tracking information once your items are on their way.</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{order_tracking_url}}" style="background: #667eea; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Track Your Order</a>
        </div>
        
        <p style="color: #666; font-size: 14px; margin-top: 30px;">Questions? Reply to this email or contact our support team.</p>
    </div>
</body>
</html>',
  'Sent when payment is successfully processed',
  true
),
(
  'Order Status Update',
  'order_status_update',
  'Order Update - Your order #{{order_number}} is {{status}}',
  '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Status Update</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Order Update 📦</h1>
    </div>
    
    <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
        <p style="font-size: 18px; margin-bottom: 25px;">Hi {{customer_name}},</p>
        
        <p style="font-size: 16px; margin-bottom: 20px;">Your order <strong>#{{order_number}}</strong> status has been updated to: <strong>{{status}}</strong></p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #4facfe;">
            <h3 style="margin-top: 0; color: #4facfe;">Order Details</h3>
            <p><strong>Order Number:</strong> {{order_number}}</p>
            <p><strong>Status:</strong> {{status}}</p>
            {{#if tracking_number}}<p><strong>Tracking Number:</strong> {{tracking_number}}</p>{{/if}}
            {{#if estimated_delivery}}<p><strong>Estimated Delivery:</strong> {{estimated_delivery}}</p>{{/if}}
        </div>
        
        {{#if status_message}}
        <p style="margin: 25px 0;">{{status_message}}</p>
        {{/if}}
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{order_tracking_url}}" style="background: #4facfe; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Track Your Order</a>
        </div>
        
        <p style="color: #666; font-size: 14px; margin-top: 30px;">Questions? Reply to this email or contact our support team.</p>
    </div>
</body>
</html>',
  'Sent when order status changes (shipped, delivered, etc.)',
  true
),
(
  'Order Cancellation',
  'order_cancellation',
  'Order Cancelled - #{{order_number}}',
  '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Cancelled</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Order Cancelled</h1>
    </div>
    
    <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
        <p style="font-size: 18px; margin-bottom: 25px;">Hi {{customer_name}},</p>
        
        <p style="font-size: 16px; margin-bottom: 20px;">Your order <strong>#{{order_number}}</strong> has been cancelled as requested.</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #ff6b6b;">
            <h3 style="margin-top: 0; color: #ff6b6b;">Cancellation Details</h3>
            <p><strong>Order Number:</strong> {{order_number}}</p>
            <p><strong>Cancelled Date:</strong> {{cancellation_date}}</p>
            <p><strong>Refund Amount:</strong> ${{refund_amount}}</p>
            {{#if cancellation_reason}}<p><strong>Reason:</strong> {{cancellation_reason}}</p>{{/if}}
        </div>
        
        <p style="margin: 25px 0;">{{#if refund_amount}}Your refund of ${{refund_amount}} will be processed back to your original payment method within 3-5 business days.{{/if}}</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{shop_url}}" style="background: #667eea; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Continue Shopping</a>
        </div>
        
        <p style="color: #666; font-size: 14px; margin-top: 30px;">Questions about your cancellation? Reply to this email or contact our support team.</p>
    </div>
</body>
</html>',
  'Sent when order is cancelled',
  true
),
(
  'Enhanced Welcome',
  'enhanced_welcome',
  'Welcome to Elyphant! 🎁 Your gifting journey starts here',
  '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Elyphant</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 32px;">Welcome to Elyphant! 🎁</h1>
    </div>
    
    <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
        <p style="font-size: 18px; margin-bottom: 25px;">Hi {{user_name}},</p>
        
        <p style="font-size: 16px; margin-bottom: 20px;">Welcome to the future of thoughtful gifting! We''re thrilled to have you join our community of amazing gift-givers.</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <h3 style="margin-top: 0; color: #667eea;">🚀 Get Started in 3 Easy Steps:</h3>
            <div style="margin: 20px 0;">
                <p style="margin: 10px 0;"><strong>1. Create Your Wishlist</strong> - Let friends know what you''d love to receive</p>
                <p style="margin: 10px 0;"><strong>2. Connect with Friends</strong> - Build your gifting network</p>
                <p style="margin: 10px 0;"><strong>3. Set Up Auto-Gifting</strong> - Never miss a special occasion again</p>
            </div>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{dashboard_url}}" style="background: #667eea; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; margin: 5px;">Get Started</a>
            <a href="{{profile_url}}" style="background: #28a745; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; margin: 5px;">Complete Profile</a>
        </div>
        
        <p style="color: #666; font-size: 14px; margin-top: 30px;">Need help getting started? Reply to this email and we''ll be happy to help!</p>
    </div>
</body>
</html>',
  'Enhanced welcome email for new users',
  true
),
(
  'Abandoned Cart Recovery',
  'abandoned_cart',
  'You left something special behind! 🛒',
  '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Complete Your Purchase</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #ffeaa7 0%, #fab1a0 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: #2d3436; margin: 0; font-size: 28px;">Don''t forget your cart! 🛒</h1>
    </div>
    
    <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
        <p style="font-size: 18px; margin-bottom: 25px;">Hi {{customer_name}},</p>
        
        <p style="font-size: 16px; margin-bottom: 20px;">You left some amazing items in your cart! Complete your purchase now before they''re gone.</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #ffeaa7;">
            <h3 style="margin-top: 0; color: #2d3436;">Items in Your Cart:</h3>
            {{#each cart_items}}
            <div style="display: flex; align-items: center; margin: 15px 0; padding: 10px; border-bottom: 1px solid #eee;">
                <p style="margin: 0;"><strong>{{name}}</strong> - ${{price}}</p>
            </div>
            {{/each}}
            <p style="margin-top: 15px; font-size: 18px;"><strong>Total: ${{cart_total}}</strong></p>
        </div>
        
        {{#if discount_code}}
        <div style="background: #d4edda; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <p style="margin: 0; color: #155724;"><strong>Special Offer:</strong> Use code <strong>{{discount_code}}</strong> for {{discount_percentage}}% off!</p>
        </div>
        {{/if}}
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{checkout_url}}" style="background: #ffeaa7; color: #2d3436; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; border: 2px solid #2d3436;">Complete Purchase</a>
        </div>
        
        <p style="color: #666; font-size: 14px; margin-top: 30px;">This cart will expire in {{expiry_hours}} hours. Complete your purchase to secure these items.</p>
    </div>
</body>
</html>',
  'Sent to recover abandoned shopping carts',
  true
),
(
  'Post-Purchase Follow-up',
  'post_purchase_followup',
  'How was your recent purchase? We''d love your feedback! ⭐',
  '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Share Your Experience</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #74b9ff 0%, #0984e3 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">How was your experience? ⭐</h1>
    </div>
    
    <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
        <p style="font-size: 18px; margin-bottom: 25px;">Hi {{customer_name}},</p>
        
        <p style="font-size: 16px; margin-bottom: 20px;">We hope you''re loving your recent purchase from order <strong>#{{order_number}}</strong>! Your feedback means the world to us.</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #74b9ff;">
            <h3 style="margin-top: 0; color: #74b9ff;">Rate Your Experience</h3>
            <div style="text-align: center; margin: 20px 0;">
                <a href="{{review_url}}&rating=5" style="background: #00b894; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px; margin: 0 5px; display: inline-block;">⭐⭐⭐⭐⭐</a>
                <a href="{{review_url}}&rating=4" style="background: #fdcb6e; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px; margin: 0 5px; display: inline-block;">⭐⭐⭐⭐</a>
                <a href="{{review_url}}&rating=3" style="background: #e17055; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px; margin: 0 5px; display: inline-block;">⭐⭐⭐</a>
            </div>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{shop_url}}" style="background: #74b9ff; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Shop Again</a>
        </div>
        
        {{#if recommended_products}}
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <h3 style="margin-top: 0; color: #74b9ff;">You Might Also Like:</h3>
            {{#each recommended_products}}
            <p style="margin: 10px 0;">• {{name}} - ${{price}}</p>
            {{/each}}
        </div>
        {{/if}}
        
        <p style="color: #666; font-size: 14px; margin-top: 30px;">Questions or concerns? Reply to this email and we''ll make it right!</p>
    </div>
</body>
</html>',
  'Sent 7 days after delivery for feedback and recommendations',
  true
);

-- Create cart sessions table for abandoned cart tracking
CREATE TABLE public.cart_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  session_id TEXT NOT NULL,
  cart_data JSONB NOT NULL DEFAULT '{}',
  total_amount NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  checkout_initiated_at TIMESTAMP WITH TIME ZONE,
  abandoned_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  recovery_emails_sent INTEGER DEFAULT 0,
  last_recovery_email_sent TIMESTAMP WITH TIME ZONE,
  is_recovered BOOLEAN DEFAULT false
);

-- Enable RLS on cart_sessions
ALTER TABLE public.cart_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for cart_sessions
CREATE POLICY "Users can manage their own cart sessions" 
ON public.cart_sessions 
FOR ALL 
USING (auth.uid() = user_id);

-- Add email tracking columns to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS confirmation_email_sent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS payment_confirmation_sent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS status_update_emails_sent JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS followup_email_sent BOOLEAN DEFAULT false;

-- Create order_email_events table for detailed email tracking
CREATE TABLE public.order_email_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id),
  email_type TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'sent',
  template_id UUID REFERENCES public.email_templates(id),
  template_variables JSONB DEFAULT '{}',
  resend_message_id TEXT,
  error_message TEXT
);

-- Enable RLS on order_email_events
ALTER TABLE public.order_email_events ENABLE ROW LEVEL SECURITY;

-- Create policies for order_email_events
CREATE POLICY "Users can view their order email events" 
ON public.order_email_events 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.orders 
  WHERE orders.id = order_email_events.order_id 
  AND orders.user_id = auth.uid()
));

CREATE POLICY "System can insert order email events" 
ON public.order_email_events 
FOR INSERT 
WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_cart_sessions_user_id ON public.cart_sessions(user_id);
CREATE INDEX idx_cart_sessions_abandoned_at ON public.cart_sessions(abandoned_at);
CREATE INDEX idx_order_email_events_order_id ON public.order_email_events(order_id);
CREATE INDEX idx_order_email_events_email_type ON public.order_email_events(email_type);

-- Create trigger to update cart_sessions timestamp
CREATE OR REPLACE FUNCTION public.update_cart_session_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_cart_sessions_updated_at
  BEFORE UPDATE ON public.cart_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_cart_session_timestamp();