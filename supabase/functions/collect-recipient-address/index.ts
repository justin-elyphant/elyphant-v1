import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('📬 [collect-recipient-address] Function invoked');

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // For GET requests, show the address collection form
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const token = url.searchParams.get('token');

      if (!token) {
        return new Response('Missing address collection token', { 
          status: 400,
          headers: corsHeaders 
        });
      }

      // Validate token
      const { data: addressRequest, error: tokenError } = await supabase
        .from('pending_recipient_addresses')
        .select('*, automated_gift_executions(*)')
        .eq('token', token)
        .gt('expires_at', new Date().toISOString())
        .is('collected_at', null)
        .single();

      if (tokenError || !addressRequest) {
        return new Response('Invalid or expired token', { 
          status: 404,
          headers: corsHeaders 
        });
      }

      // Return HTML form
      const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Share Your Shipping Address</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
    .container { background: white; border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); max-width: 500px; width: 100%; padding: 40px; }
    h1 { color: #1a202c; font-size: 24px; margin-bottom: 8px; }
    .subtitle { color: #718096; margin-bottom: 24px; }
    .form-group { margin-bottom: 16px; }
    label { display: block; color: #4a5568; font-weight: 500; margin-bottom: 6px; font-size: 14px; }
    input { width: 100%; padding: 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 16px; transition: border-color 0.2s; }
    input:focus { outline: none; border-color: #667eea; }
    button { width: 100%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; transition: transform 0.2s; }
    button:hover { transform: translateY(-2px); }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
    .success { background: #48bb78; color: white; padding: 16px; border-radius: 8px; text-align: center; display: none; }
    .error { background: #f56565; color: white; padding: 16px; border-radius: 8px; text-align: center; display: none; margin-bottom: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🎁 Share Your Address</h1>
    <p class="subtitle">Someone special wants to send you a gift!</p>
    
    <div id="error" class="error"></div>
    <div id="success" class="success">
      ✅ Thank you! Your address has been securely saved.
    </div>
    
    <form id="addressForm">
      <div class="form-group">
        <label>Full Name *</label>
        <input type="text" name="name" required>
      </div>
      
      <div class="form-group">
        <label>Address Line 1 *</label>
        <input type="text" name="address_line1" required placeholder="Street address">
      </div>
      
      <div class="form-group">
        <label>Address Line 2</label>
        <input type="text" name="address_line2" placeholder="Apt, suite, unit, etc. (optional)">
      </div>
      
      <div class="form-group">
        <label>City *</label>
        <input type="text" name="city" required>
      </div>
      
      <div class="form-group">
        <label>State *</label>
        <input type="text" name="state" required placeholder="e.g., CA">
      </div>
      
      <div class="form-group">
        <label>ZIP Code *</label>
        <input type="text" name="zip_code" required>
      </div>
      
      <div class="form-group">
        <label>Country</label>
        <input type="text" name="country" value="US" required>
      </div>
      
      <button type="submit">Share My Address</button>
    </form>
  </div>
  
  <script>
    document.getElementById('addressForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.target;
      const button = form.querySelector('button');
      const errorDiv = document.getElementById('error');
      const successDiv = document.getElementById('success');
      
      button.disabled = true;
      button.textContent = 'Submitting...';
      errorDiv.style.display = 'none';
      
      const formData = new FormData(form);
      const address = Object.fromEntries(formData.entries());
      
      try {
        const response = await fetch(window.location.href, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address })
        });
        
        const result = await response.json();
        
        if (response.ok) {
          form.style.display = 'none';
          successDiv.style.display = 'block';
        } else {
          throw new Error(result.error || 'Failed to submit address');
        }
      } catch (error) {
        errorDiv.textContent = error.message;
        errorDiv.style.display = 'block';
        button.disabled = false;
        button.textContent = 'Share My Address';
      }
    });
  </script>
</body>
</html>`;

      return new Response(html, {
        headers: { ...corsHeaders, 'Content-Type': 'text/html' }
      });
    }

    // For POST requests, save the address
    if (req.method === 'POST') {
      const { address } = await req.json();
      const url = new URL(req.url);
      const token = url.searchParams.get('token');

      if (!token) {
        return new Response(
          JSON.stringify({ error: 'Missing address collection token' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Validate token and get request details
      const { data: addressRequest, error: tokenError } = await supabase
        .from('pending_recipient_addresses')
        .select('*, automated_gift_executions(*)')
        .eq('token', token)
        .gt('expires_at', new Date().toISOString())
        .is('collected_at', null)
        .single();

      if (tokenError || !addressRequest) {
        return new Response(
          JSON.stringify({ error: 'Invalid or expired token' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Save the address
      await supabase
        .from('pending_recipient_addresses')
        .update({
          shipping_address: address,
          collected_at: new Date().toISOString()
        })
        .eq('id', addressRequest.id);

      // Update execution status
      await supabase
        .from('automated_gift_executions')
        .update({
          status: 'approved',
          address_collection_status: 'received',
          address_metadata: {
            collected_at: new Date().toISOString(),
            source: 'recipient_provided'
          }
        })
        .eq('id', addressRequest.execution_id);

      console.log('✅ [collect-recipient-address] Address collected successfully');

      // Notify the sender
      await supabase.functions.invoke('ecommerce-email-orchestrator', {
        body: {
          eventType: 'address_collected_notification',
          userId: addressRequest.requested_by,
          recipientEmail: addressRequest.recipient_email,
          executionId: addressRequest.execution_id
        }
      });

      // Re-trigger approve-auto-gift to continue processing
      await supabase.functions.invoke('approve-auto-gift', {
        body: {
          executionId: addressRequest.execution_id,
          approvalDecision: 'approved'
        }
      });

      return new Response(
        JSON.stringify({ success: true, message: 'Address saved successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response('Method not allowed', { 
      status: 405,
      headers: corsHeaders 
    });

  } catch (error: any) {
    console.error('❌ [collect-recipient-address] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});