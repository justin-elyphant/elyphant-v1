import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import Stripe from 'https://esm.sh/stripe@14.21.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🪝 [START] Stripe Webhook v2 - Processing event...');
    
    const signature = req.headers.get('stripe-signature');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    
    if (!signature || !webhookSecret) {
      console.error('❌ Missing webhook signature or secret');
      return new Response('Webhook signature verification failed', { status: 400 });
    }

    const stripe = new Stripe(
      Deno.env.get('STRIPE_SECRET_KEY') || '',
      { apiVersion: '2023-10-16' }
    );

    const body = await req.text();
    let event: Stripe.Event;

    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
      console.log(`✅ [${new Date().toISOString()}] Webhook verified: ${event.type} | ID: ${event.id}`);
    } catch (err: any) {
      console.error(`❌ [${new Date().toISOString()}] Webhook signature verification failed:`, err.message);
      return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // CORE: Handle checkout.session.completed (primary order creation path)
    // This handles BOTH payment mode and setup mode (deferred payment) sessions
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log(`📋 [${new Date().toISOString()}] Processing checkout.session.completed: ${session.id} | Mode: ${session.mode}`);
      await handleCheckoutSessionCompleted(session, supabase, stripe);
    } 
    // CORE: Handle checkout.session.expired
    else if (event.type === 'checkout.session.expired') {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log(`⏱️ [${new Date().toISOString()}] Processing checkout.session.expired: ${session.id}`);
      await handleCheckoutSessionExpired(session, supabase);
    }

    console.log(`✅ [${new Date().toISOString()}] Webhook processing complete`);
    return new Response(
      JSON.stringify({ received: true, event_type: event.type, event_id: event.id }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error(`❌ [${new Date().toISOString()}] Webhook processing error:`, error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

// ============================================================================
// HELPER: Group line items by recipient for multi-recipient order splitting
// ============================================================================
interface DeliveryGroup {
  deliveryGroupId: string;
  recipientId: string | null;
  recipientName: string;
  items: any[];
  giftMessage: string;
  shippingAddress: any;
}

function groupItemsByRecipient(
  lineItems: any[],
  defaultShippingAddress: any,
  metadata: any
): DeliveryGroup[] {
  const groupsMap = new Map<string, DeliveryGroup>();

  for (const item of lineItems) {
    const recipientId = item.recipient_id || null; // null for 'self'
    const groupKey = recipientId || 'self';

    if (!groupsMap.has(groupKey)) {
      // METADATA-FIRST: Use recipient shipping from Stripe metadata if available
      let initialShippingAddress = defaultShippingAddress;
      if (item.recipient_shipping && item.recipient_shipping.address_line1) {
        initialShippingAddress = item.recipient_shipping;
        console.log(`🎁 [GROUP] Using metadata-embedded address for ${item.recipient_name || groupKey}: ${initialShippingAddress.city}, ${initialShippingAddress.state}`);
      }
      
      groupsMap.set(groupKey, {
        deliveryGroupId: groupKey,
        recipientId: recipientId,
        recipientName: item.recipient_name || 'Self',
        items: [],
        giftMessage: item.gift_message || '',
        shippingAddress: initialShippingAddress,
      });
    }

    const group = groupsMap.get(groupKey)!;
    group.items.push(item);

    // Update gift message if this item has one and group doesn't
    if (item.gift_message && !group.giftMessage) {
      group.giftMessage = item.gift_message;
    }
    
    // METADATA-FIRST: If this item has recipient shipping and group doesn't have a valid one, use it
    if (item.recipient_shipping && item.recipient_shipping.address_line1 && 
        (!group.shippingAddress.address_line1 || group.shippingAddress === defaultShippingAddress)) {
      group.shippingAddress = item.recipient_shipping;
      console.log(`🎁 [GROUP] Updated address for ${group.recipientName} from item metadata: ${item.recipient_shipping.city}, ${item.recipient_shipping.state}`);
    }
  }

  return Array.from(groupsMap.values());
}

// ============================================================================
// HELPER: Fetch recipient addresses from user_connections table
// ============================================================================
async function fetchRecipientAddresses(
  recipientIds: string[],
  supabase: any
): Promise<Map<string, any>> {
  const addressMap = new Map<string, any>();
  
  if (recipientIds.length === 0) return addressMap;
  
  console.log(`📍 [FETCH] Looking up addresses for ${recipientIds.length} recipient(s)...`);
  
  // ENHANCED: Join to profiles table to get recipient-owned shipping address with phone
  const { data: connections, error } = await supabase
    .from('user_connections')
    .select(`
      id, 
      pending_recipient_name, 
      pending_shipping_address, 
      pending_recipient_phone,
      connected_user_id,
      connected_profile:profiles!user_connections_connected_user_id_fkey(
        name,
        shipping_address
      )
    `)
    .in('id', recipientIds);
  
  if (error) {
    console.error(`❌ [FETCH] Failed to fetch recipient addresses:`, error);
    return addressMap;
  }
  
  for (const conn of connections || []) {
    // PRIORITY 1: Use connected profile's shipping address (recipient-owned with phone!)
    if (conn.connected_profile?.shipping_address) {
      const profileAddr = conn.connected_profile.shipping_address;
      addressMap.set(conn.id, {
        name: conn.connected_profile.name || conn.pending_recipient_name || '',
        address_line1: profileAddr.address_line1 || profileAddr.street || '',
        address_line2: profileAddr.address_line2 || '',
        city: profileAddr.city || '',
        state: profileAddr.state || '',
        postal_code: profileAddr.zip_code || profileAddr.zipCode || profileAddr.postal_code || '',
        country: profileAddr.country || 'US',
        phone: profileAddr.phone || '',  // ✅ CRITICAL: Phone from recipient's profile!
      });
      console.log(`✅ [FETCH] Using PROFILE address for ${conn.connected_profile.name}: ${profileAddr.city}, ${profileAddr.state} | Phone: ${profileAddr.phone ? 'YES' : 'MISSING'}`);
      continue;
    }
    
    // PRIORITY 2: Fall back to pending_shipping_address (sender-provided)
    if (conn.pending_shipping_address) {
      const addr = conn.pending_shipping_address;
      // Normalize field names from user_connections format to order format
      addressMap.set(conn.id, {
        name: addr.name || conn.pending_recipient_name || '',
        address_line1: addr.street || addr.address_line1 || addr.addressLine1 || '',
        address_line2: addr.address_line2 || addr.addressLine2 || '',
        city: addr.city || '',
        state: addr.state || '',
        postal_code: addr.zipCode || addr.zip_code || addr.postalCode || addr.postal_code || '',
        country: addr.country || 'US',
        phone: addr.phone || conn.pending_recipient_phone || '',
      });
      console.log(`✅ [FETCH] Found pending address for ${conn.pending_recipient_name}: ${addr.city}, ${addr.state}`);
    } else {
      console.warn(`⚠️ [FETCH] No address found for connection ${conn.id} (${conn.pending_recipient_name}) - no profile or pending address`);
    }
  }
  
  return addressMap;
}

// ============================================================================
// HELPER: Calculate total amount for a delivery group
// ============================================================================
function calculateGroupTotal(items: any[]): number {
  const itemsTotal = items.reduce((sum, item) => {
    return sum + (item.unit_price * item.quantity);
  }, 0);

  // Add shipping ($6.99) and gifting fee (10% + $1.00) per group
  const shippingCost = 6.99;
  const giftingFee = (itemsTotal * 0.10) + 1.00;
  
  return itemsTotal + shippingCost + giftingFee;
}

// ============================================================================
// CORE HANDLER: checkout.session.completed
// ============================================================================
async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
  supabase: any,
  stripe: Stripe
) {
  const sessionId = session.id;
  const startTime = Date.now();
  console.log(`📋 [${new Date().toISOString()}] [START] Processing checkout.session.completed: ${sessionId}`);

  // STEP 1: Check for existing order (idempotency)
  console.log(`🔍 [STEP 1] Checking for existing order...`);
  const { data: existingOrder } = await supabase
    .from('orders')
    .select('id, status, receipt_sent_at, user_id')
    .eq('checkout_session_id', sessionId)
    .single();

  if (existingOrder) {
    console.log(`✅ [STEP 1] Order already exists: ${existingOrder.id} | Status: ${existingOrder.status}`);
    console.log(`🔍 [STEP 1.1] Idempotency check - skipping insert, checking follow-up steps...`);
    
    // Check if receipt needs to be sent
    if (!existingOrder.receipt_sent_at) {
      console.log(`📧 [STEP 1.2] Receipt not sent yet, triggering email orchestrator...`);
      const lineItemsForRetry = await stripe.checkout.sessions.listLineItems(sessionId, { limit: 100 });
      
      // Extract Amazon ASINs from product metadata for receipt
      const lineItemsData = await Promise.all(
        lineItemsForRetry.data.map(async (item: any) => {
          const stripeProductId = item.price?.product;
          const description = item.description || 'Product';
          
          // Skip non-product items
          if (description === 'Shipping' || description === 'Tax' || description.includes('Gifting Fee')) {
            return null;
          }
          
          let amazonAsin = 'unknown';
          if (stripeProductId) {
            try {
              const product = await stripe.products.retrieve(stripeProductId);
              amazonAsin = product.metadata?.product_id || 'unknown';
            } catch (err) {
              console.error(`⚠️  Failed to fetch product metadata:`, err);
            }
          }
          
          return {
            product_id: amazonAsin,  // Use Amazon ASIN
            title: description,
            quantity: item.quantity || 1,
            unit_price: item.price?.unit_amount ? item.price.unit_amount / 100 : 0,
            currency: item.price?.currency || 'usd',
          };
        })
      );
      
      // Filter out null entries
      const filteredLineItems = lineItemsData.filter((item): item is NonNullable<typeof item> => item !== null);
      
      await triggerEmailOrchestrator(existingOrder.id, session, filteredLineItems, supabase);
    }
    
    // Check if processing needed (non-scheduled, not yet submitted)
    console.log(`🔍 [STEP 1.3] Checking if order needs processing...`);
    const { data: fullOrder } = await supabase
      .from('orders')
      .select('id, status, is_scheduled, zinc_order_id')
      .eq('id', existingOrder.id)
      .single();
      
    if (fullOrder && !fullOrder.is_scheduled && !fullOrder.zinc_order_id && fullOrder.status !== 'processing') {
      console.log(`🔄 [STEP 1.4] Order not yet processing, triggering process-order-v2 with retry...`);
      try {
        await triggerOrderProcessingWithRetry(fullOrder.id, supabase, existingOrder.user_id);
      } catch (err: any) {
        console.error(`❌ [STEP 1.4] Processing retry failed:`, err);
      }
    }
    
    console.log(`✅ [${new Date().toISOString()}] Idempotent handling complete for ${existingOrder.id}`);
    return;
  }

  console.log(`✅ [STEP 1] No existing order found - proceeding with creation`);

  // STEP 1.5: Check if this is a SETUP MODE session (deferred payment for 8+ day orders)
  const metadata = session.metadata || {};
  const isDeferredPayment = metadata.deferred_payment === 'true';
  
  if (isDeferredPayment && session.mode === 'setup') {
    console.log(`🔮 [STEP 1.5] DEFERRED PAYMENT detected - creating pending_payment order`);
    await handleDeferredPaymentOrder(session, supabase);
    return;
  }

  // STEP 2: Extract shipping from metadata (collected at /checkout)
  console.log(`🔍 [STEP 2] Extracting shipping address from session metadata...`);
  
  const shippingAddress = {
    name: metadata.ship_name || '',
    address_line1: metadata.ship_address_line1 || '',
    address_line2: metadata.ship_address_line2 || '',
    city: metadata.ship_city || '',
    state: metadata.ship_state || '',
    postal_code: metadata.ship_postal_code || '',
    country: metadata.ship_country || 'US',
  };

  console.log(`📦 [STEP 2] Shipping extracted: ${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.postal_code}`);

  // Validate shipping completeness
  const missingShippingFields = [];
  if (!shippingAddress.address_line1) missingShippingFields.push('address_line1');
  if (!shippingAddress.city) missingShippingFields.push('city');
  if (!shippingAddress.state) missingShippingFields.push('state');
  if (!shippingAddress.postal_code) missingShippingFields.push('postal_code');

  if (missingShippingFields.length > 0) {
    console.error(`❌ [STEP 2] Incomplete shipping address: missing ${missingShippingFields.join(', ')}`);
    console.log(`[DEBUG] session.metadata keys:`, Object.keys(session.metadata || {}));
    throw new Error(`Incomplete shipping address: missing ${missingShippingFields.join(', ')}`);
  }

  // STEP 3: Extract scalars from metadata
  console.log(`🔍 [STEP 3] Extracting order metadata...`);
  const userId = metadata.user_id || session.client_reference_id;
  const scheduledDate = metadata.scheduled_delivery_date || null;
  const isScheduled = !!scheduledDate && new Date(scheduledDate) > new Date();
  const isAutoGift = metadata.is_auto_gift === 'true';
  const autoGiftRuleId = metadata.auto_gift_rule_id || null;
  const deliveryGroupId = metadata.delivery_group_id || null;

  console.log(`✅ [STEP 3] User: ${userId} | Scheduled: ${isScheduled} | AutoGift: ${isAutoGift} | DeliveryGroup: ${deliveryGroupId}`);

  if (!userId) {
    console.error('❌ No user_id in session metadata or client_reference_id');
    throw new Error('Missing user_id in checkout session');
  }

  // STEP 4: Fetch line items from Stripe API and extract Amazon ASINs from metadata
  console.log(`📋 [STEP 4] Fetching line items from Stripe...`);
  const lineItemsResponse = await stripe.checkout.sessions.listLineItems(sessionId, { limit: 100 });
  
  // Extract line items and fetch product metadata to get Amazon ASINs
  // Capture pricing components from Stripe line items BEFORE filtering
  let shippingAmount = 0;
  let taxAmount = 0;
  let giftingFeeAmount = 0;
  let subtotalAmount = 0;
  
  const lineItemsWithMetadata = await Promise.all(
    lineItemsResponse.data.map(async (item: any) => {
      const stripeProductId = item.price?.product;
      const description = item.description || '';
      const itemAmount = item.amount_total || 0; // Amount in cents
      
      // Capture non-product pricing items BEFORE skipping them
      if (description === 'Shipping') {
        shippingAmount = itemAmount;
        console.log(`💰 Captured Shipping: $${(itemAmount / 100).toFixed(2)} (${itemAmount} cents)`);
        return null;
      }
      if (description === 'Tax') {
        taxAmount = itemAmount;
        console.log(`💰 Captured Tax: $${(itemAmount / 100).toFixed(2)} (${itemAmount} cents)`);
        return null;
      }
      if (description.includes('Gifting Fee')) {
        giftingFeeAmount = itemAmount;
        console.log(`💰 Captured Gifting Fee: $${(itemAmount / 100).toFixed(2)} (${itemAmount} cents)`);
        return null;
      }
      
      // This is a product item - accumulate subtotal
      subtotalAmount += itemAmount;
      
      // Fetch product to get metadata containing Amazon ASIN, gift message, recipient shipping, and wishlist tracking
      let amazonAsin = 'unknown';
      let recipientId = null;
      let recipientName = '';
      let giftMessage = '';
      let imageUrl = '';
      let wishlistId = '';
      let wishlistItemId = '';
      // NEW: Capture recipient shipping from Stripe product metadata
      let recipientShipping: any = null;
      
      if (stripeProductId) {
        try {
          const product = await stripe.products.retrieve(stripeProductId);
          amazonAsin = product.metadata?.product_id || 'unknown';
          recipientId = product.metadata?.recipient_id || null;
          recipientName = product.metadata?.recipient_name || '';
          giftMessage = product.metadata?.gift_message || '';
          imageUrl = product.images?.[0] || '';  // Get first product image from Stripe
          // Wishlist tracking
          wishlistId = product.metadata?.wishlist_id || '';
          wishlistItemId = product.metadata?.wishlist_item_id || '';
          
          // CRITICAL: Extract recipient shipping address from Stripe metadata (metadata-first routing)
          if (product.metadata?.recipient_ship_line1) {
            recipientShipping = {
              name: product.metadata.recipient_ship_name || recipientName,
              address_line1: product.metadata.recipient_ship_line1,
              address_line2: product.metadata.recipient_ship_line2 || '',
              city: product.metadata.recipient_ship_city || '',
              state: product.metadata.recipient_ship_state || '',
              postal_code: product.metadata.recipient_ship_postal || '',
              country: product.metadata.recipient_ship_country || 'US',
            };
            console.log(`✅ [STEP 4.1] Product: ${description} | Amazon ASIN: ${amazonAsin} | Recipient Shipping from metadata: ${recipientShipping.city}, ${recipientShipping.state}`);
          } else {
            console.log(`✅ [STEP 4.1] Product: ${description} | Amazon ASIN: ${amazonAsin} | Image: ${imageUrl ? 'Yes' : 'MISSING'} | Wishlist: ${wishlistId ? 'Yes' : 'No'} | Stripe ID: ${stripeProductId}`);
          }
          
          if (!imageUrl) {
            console.warn(`⚠️  [IMAGE] No image URL for product: ${description} (${amazonAsin})`);
          }
        } catch (err) {
          console.error(`⚠️  Failed to fetch product ${stripeProductId}:`, err);
        }
      }
      
      return {
        product_id: amazonAsin,  // Use Amazon ASIN from metadata, not Stripe Price ID
        title: description || 'Product',
        quantity: item.quantity || 1,
        unit_price: item.price?.unit_amount ? item.price.unit_amount / 100 : 0,
        currency: item.price?.currency || 'usd',
        image_url: imageUrl,  // Include product image
        recipient_id: recipientId === 'self' ? null : recipientId,  // Convert 'self' to null
        recipient_name: recipientName,
        gift_message: giftMessage,
        wishlist_id: wishlistId,
        wishlist_item_id: wishlistItemId,
        // NEW: Include recipient shipping from Stripe metadata (for metadata-first routing)
        recipient_shipping: recipientShipping,
      };
    })
  );
  
  // Filter out null entries (non-product items)
  const lineItems = lineItemsWithMetadata.filter((item): item is NonNullable<typeof item> => item !== null);
  
  console.log(`✅ [STEP 4] Found ${lineItems.length} product line items (filtered out fees/shipping/tax)`);
  console.log(`💰 Pricing breakdown - Subtotal: $${(subtotalAmount / 100).toFixed(2)}, Shipping: $${(shippingAmount / 100).toFixed(2)}, Tax: $${(taxAmount / 100).toFixed(2)}, Gifting Fee: $${(giftingFeeAmount / 100).toFixed(2)}`);

  if (lineItems.length === 0) {
    console.error('❌ No line items found in checkout session');
    throw new Error('No line items in checkout session');
  }

  // STEP 5: Group line items by recipient (multi-recipient order splitting)
  console.log(`📦 [STEP 5] Grouping line items by recipient for order splitting...`);
  
  // 5.1: Get unique recipient IDs (excluding 'self' and null)
  const uniqueRecipientIds = [...new Set(
    lineItems
      .map(item => item.recipient_id)
      .filter((id): id is string => !!id && id !== 'self')
  )];
  console.log(`📍 [STEP 5.1] Found ${uniqueRecipientIds.length} unique recipient(s): ${uniqueRecipientIds.join(', ') || 'none'}`);
  
  // 5.2: Fetch recipient addresses from user_connections
  const recipientAddresses = await fetchRecipientAddresses(uniqueRecipientIds, supabase);
  console.log(`📍 [STEP 5.2] Fetched ${recipientAddresses.size} recipient address(es)`);
  
  // 5.3: Group items by recipient
  const deliveryGroups = groupItemsByRecipient(lineItems, shippingAddress, metadata);
  
  // 5.4: Override addresses for non-self recipients (METADATA-FIRST, then DB lookup fallback)
  for (const group of deliveryGroups) {
    // Skip 'self' groups - they use buyer's address
    if (!group.recipientId || group.recipientId === 'self') {
      continue;
    }
    
    // Check if group already has a valid address from Stripe metadata (set in groupItemsByRecipient)
    const hasMetadataAddress = group.shippingAddress && 
                               group.shippingAddress.address_line1 && 
                               group.shippingAddress !== shippingAddress;
    
    if (hasMetadataAddress) {
      console.log(`✅ [STEP 5.4] Gift for ${group.recipientName}: using METADATA address: ${group.shippingAddress.city}, ${group.shippingAddress.state}`);
    } else if (recipientAddresses.has(group.recipientId)) {
      // Fallback: Use address from user_connections DB lookup
      const recipientAddr = recipientAddresses.get(group.recipientId);
      group.shippingAddress = recipientAddr;
      console.log(`🎁 [STEP 5.4] Gift for ${group.recipientName}: using DB lookup address: ${recipientAddr.city}, ${recipientAddr.state}`);
    } else {
      // No address from metadata OR DB - using buyer's address (PROBLEM!)
      console.warn(`⚠️ [STEP 5.4] WARNING: Gift for ${group.recipientName} (${group.recipientId}) using BUYER's address - no recipient address found in metadata or DB!`);
    }
  }
  
  console.log(`✅ [STEP 5] Found ${deliveryGroups.length} delivery group(s)`);

  // STEP 6: Create orders (parent + children for multi-recipient)
  if (deliveryGroups.length === 1) {
    // Single recipient - create one order (no split needed)
    console.log(`💾 [STEP 6] Single recipient detected - creating standard order...`);
    const group = deliveryGroups[0];
    
    const orderData = {
      user_id: userId,
      checkout_session_id: sessionId,
      payment_intent_id: session.payment_intent as string || null,
      status: isScheduled ? 'scheduled' : 'payment_confirmed',
      payment_status: session.payment_status === 'unpaid' ? 'authorized' : session.payment_status,
      total_amount: session.amount_total ? session.amount_total / 100 : 0,
      currency: session.currency || 'usd',
      line_items: {
        items: group.items,
        subtotal: subtotalAmount,
        shipping: shippingAmount,
        tax: taxAmount,
        gifting_fee: giftingFeeAmount
      },
      shipping_address: group.shippingAddress,
      gift_options: {
        isGift: !!group.giftMessage || isAutoGift,
        giftMessage: group.giftMessage,
        giftWrapping: false,
        isSurpriseGift: false
      },
      scheduled_delivery_date: scheduledDate,
      is_auto_gift: isAutoGift,
      auto_gift_rule_id: autoGiftRuleId,
      delivery_group_id: group.deliveryGroupId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: newOrder, error: insertError } = await supabase
      .from('orders')
      .insert(orderData)
      .select('id, order_number, status')
      .single();

    if (insertError) {
      console.error(`❌ [STEP 6] Failed to create order:`, insertError);
      throw new Error(`Failed to create order: ${insertError.message}`);
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ [STEP 6] Order created in ${elapsed}s: ${newOrder.id} | Number: ${newOrder.order_number}`);

    // STEP 6.1: Track wishlist item purchases
    console.log(`📋 [STEP 6.1] Tracking wishlist item purchases...`);
    for (const item of group.items) {
      if (item.wishlist_id && item.wishlist_item_id) {
        const { error: purchaseError } = await supabase
          .from('wishlist_item_purchases')
          .insert({
            wishlist_id: item.wishlist_id,
            item_id: item.wishlist_item_id,
            product_id: item.product_id,
            purchaser_user_id: userId,
            is_anonymous: false,
            order_id: newOrder.id,
            quantity: item.quantity,
            price_paid: item.unit_price * item.quantity
          });
        
        if (purchaseError) {
          console.warn(`⚠️ Failed to track wishlist purchase:`, purchaseError);
        } else {
          console.log(`✅ Wishlist item tracked: ${item.wishlist_item_id}`);
        }
      }
    }

    // Send email and process
    await triggerEmailOrchestrator(newOrder.id, session, group.items, supabase);
    
    if (!isScheduled && session.payment_status === 'paid') {
      await triggerOrderProcessingWithRetry(newOrder.id, supabase, userId);
    }

  } else {
    // Multi-recipient - create parent + child orders
    console.log(`💾 [STEP 6] Multi-recipient detected - creating parent + ${deliveryGroups.length} child orders...`);
    
    // Create parent order (for customer history, not sent to Zinc)
    const parentOrderData = {
      user_id: userId,
      checkout_session_id: sessionId,
      payment_intent_id: session.payment_intent as string || null,
      status: 'split_parent',
      payment_status: session.payment_status === 'paid' ? 'paid' : 'pending',
      total_amount: session.amount_total ? session.amount_total / 100 : 0,
      currency: session.currency || 'usd',
      line_items: lineItems, // All items in parent
      shipping_address: shippingAddress, // Primary shipping from metadata
      gift_options: {
        isGift: deliveryGroups.some(g => !!g.giftMessage),
        giftMessage: 'Multi-recipient order - see child orders for details',
        giftWrapping: false,
        isSurpriseGift: false
      },
      notes: JSON.stringify({
        is_multi_recipient: true,
        total_delivery_groups: deliveryGroups.length
      }),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: parentOrder, error: parentError } = await supabase
      .from('orders')
      .insert(parentOrderData)
      .select('id, order_number')
      .single();

    if (parentError) {
      console.error(`❌ [STEP 6.1] Failed to create parent order:`, parentError);
      throw new Error(`Failed to create parent order: ${parentError.message}`);
    }

    console.log(`✅ [STEP 6.1] Parent order created: ${parentOrder.id} | Number: ${parentOrder.order_number}`);

    // Create child orders (one per recipient, these get sent to Zinc)
    const childOrderIds: string[] = [];
    
    for (let i = 0; i < deliveryGroups.length; i++) {
      const group = deliveryGroups[i];
      const groupLabel = String.fromCharCode(65 + i); // A, B, C, etc.
      
      console.log(`💾 [STEP 6.${i + 2}] Creating child order ${groupLabel} for recipient: ${group.recipientName || 'Self'}...`);
      
      // Calculate proportional pricing for this group
      const groupSubtotal = group.items.reduce((sum, item) => sum + (item.unit_price * item.quantity * 100), 0);
      const groupProportion = subtotalAmount > 0 ? groupSubtotal / subtotalAmount : 1;
      const groupShipping = Math.round(shippingAmount * groupProportion);
      const groupTax = Math.round(taxAmount * groupProportion);
      const groupGiftingFee = Math.round(giftingFeeAmount * groupProportion);
      
      const childOrderData = {
        user_id: userId,
        checkout_session_id: sessionId,
        payment_intent_id: session.payment_intent as string || null,
        parent_order_id: parentOrder.id,
        delivery_group_id: group.deliveryGroupId,
        status: isScheduled ? 'scheduled' : 'payment_confirmed',
        payment_status: session.payment_status === 'paid' ? 'paid' : 'pending',
        total_amount: calculateGroupTotal(group.items),
        currency: session.currency || 'usd',
        line_items: {
          items: group.items,
          subtotal: groupSubtotal,
          shipping: groupShipping,
          tax: groupTax,
          gifting_fee: groupGiftingFee
        },
        shipping_address: group.shippingAddress,
        gift_options: {
          isGift: !!group.giftMessage || isAutoGift,
          giftMessage: group.giftMessage,
          giftWrapping: false,
          isSurpriseGift: false
        },
        scheduled_delivery_date: scheduledDate,
        is_auto_gift: isAutoGift,
        auto_gift_rule_id: autoGiftRuleId,
        notes: JSON.stringify({
          parent_order_id: parentOrder.id,
          delivery_group_label: groupLabel,
          recipient_name: group.recipientName
        }),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: childOrder, error: childError } = await supabase
        .from('orders')
        .insert(childOrderData)
        .select('id, order_number, status')
        .single();

      if (childError) {
        console.error(`❌ [STEP 6.${i + 2}] Failed to create child order ${groupLabel}:`, childError);
        throw new Error(`Failed to create child order ${groupLabel}: ${childError.message}`);
      }

      console.log(`✅ [STEP 6.${i + 2}] Child order ${groupLabel} created: ${childOrder.id} | Number: ${childOrder.order_number}`);
      childOrderIds.push(childOrder.id);

      // Process child order immediately if not scheduled
      if (!isScheduled && session.payment_status === 'paid') {
        console.log(`🚀 [STEP 6.${i + 2}] Triggering processing for child order ${groupLabel}...`);
        try {
          await triggerOrderProcessingWithRetry(childOrder.id, supabase, userId);
        } catch (processingError: any) {
          console.error(`❌ Child order ${groupLabel} processing failed:`, processingError);
        }
      }
    }

    // Send single confirmation email to customer showing all recipients
    console.log(`📧 [STEP 7] Sending consolidated receipt email for parent order ${parentOrder.id}...`);
    await triggerEmailOrchestrator(parentOrder.id, session, lineItems, supabase);

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ [STEP 6] Multi-recipient order complete in ${elapsed}s: Parent ${parentOrder.id} + ${childOrderIds.length} children`);
  }

  console.log(`✅ [${new Date().toISOString()}] checkout.session.completed processing complete for ${sessionId}`);
}

// ============================================================================
// CORE HANDLER: checkout.session.expired
// ============================================================================
async function handleCheckoutSessionExpired(
  session: Stripe.Checkout.Session,
  supabase: any
) {
  const sessionId = session.id;
  console.log(`⏱️ Processing checkout.session.expired: ${sessionId}`);

  const { data: existingOrder } = await supabase
    .from('orders')
    .select('id, status')
    .eq('checkout_session_id', sessionId)
    .single();

  if (existingOrder && existingOrder.status === 'payment_confirmed') {
    console.log(`⚠️ Marking order as expired: ${existingOrder.id}`);
    await supabase
      .from('orders')
      .update({ status: 'expired', updated_at: new Date().toISOString() })
      .eq('id', existingOrder.id);
  } else {
    console.log(`ℹ️ No confirmed order found for expired session ${sessionId}`);
  }
}

// ============================================================================
// HELPER: Trigger email orchestrator (idempotent)
// ============================================================================
async function triggerEmailOrchestrator(
  orderId: string,
  session: Stripe.Checkout.Session,
  lineItems: any[],
  supabase: any
) {
  try {
    console.log(`📧 [${new Date().toISOString()}] Triggering email orchestrator for order ${orderId}...`);
    
    const recipientEmail = session.customer_details?.email;
    if (!recipientEmail) {
      console.error(`❌ [${new Date().toISOString()}] No customer email found in session ${session.id}`);
      return;
    }

    const { error } = await supabase.functions.invoke('ecommerce-email-orchestrator', {
      body: {
        eventType: 'order_confirmation',
        recipientEmail: recipientEmail,
        orderId: orderId // Let orchestrator fetch complete order details from DB
      }
    });
    
    if (error) {
      console.error(`❌ [${new Date().toISOString()}] Email orchestrator error:`, error);
    } else {
      console.log(`✅ [${new Date().toISOString()}] Email orchestrator triggered successfully for ${recipientEmail}`);
    }
  } catch (err: any) {
    console.error(`❌ [${new Date().toISOString()}] Failed to trigger email orchestrator:`, err.message);
  }
}

// ============================================================================
// HELPER: Handle deferred payment orders (setup mode - 8+ days before delivery)
// ============================================================================
async function handleDeferredPaymentOrder(
  session: Stripe.Checkout.Session,
  supabase: any
) {
  const sessionId = session.id;
  const metadata = session.metadata || {};
  const startTime = Date.now();
  
  console.log(`🔮 [DEFERRED] Creating pending_payment order for session: ${sessionId}`);
  
  // Extract user info
  const userId = metadata.user_id || session.client_reference_id;
  if (!userId) {
    throw new Error('Missing user_id in deferred payment session');
  }
  
  // Get the setup intent to extract payment method
  const setupIntentId = session.setup_intent as string;
  if (!setupIntentId) {
    throw new Error('No setup_intent found in setup mode session');
  }
  
  console.log(`🔍 [DEFERRED] Fetching setup intent: ${setupIntentId}`);
  
  // We need to fetch the setup intent to get the payment method
  // This is done via the Stripe SDK in the calling context, but we have session.setup_intent
  // The payment_method is attached to the setup_intent after completion
  
  // Extract shipping address from metadata
  const shippingAddress = {
    name: metadata.ship_name || '',
    address_line1: metadata.ship_address_line1 || '',
    address_line2: metadata.ship_address_line2 || '',
    city: metadata.ship_city || '',
    state: metadata.ship_state || '',
    postal_code: metadata.ship_postal_code || '',
    country: metadata.ship_country || 'US',
  };
  
  // Validate shipping
  if (!shippingAddress.address_line1 || !shippingAddress.city) {
    console.error(`❌ [DEFERRED] Missing shipping address`);
    throw new Error('Missing shipping address for deferred payment order');
  }
  
  // Parse order total from metadata
  const totalAmountCents = Number(metadata.order_total_cents) || 0;
  const totalAmount = totalAmountCents / 100;
  
  // Get Stripe customer ID
  const stripeCustomerId = metadata.stripe_customer_id || session.customer as string;
  
  // CRITICAL: Parse cart items from metadata (stored by create-checkout-session for setup mode)
  // This is how we preserve product info for Zinc fulfillment
  let cartItems: any[] = [];
  
  if (metadata.cart_items) {
    // Single field storage (small cart)
    try {
      cartItems = JSON.parse(metadata.cart_items);
      console.log(`✅ [DEFERRED] Parsed ${cartItems.length} cart items from metadata`);
    } catch (e) {
      console.error(`❌ [DEFERRED] Failed to parse cart_items:`, e);
    }
  } else if (metadata.cart_items_chunks) {
    // Chunked storage (large cart)
    const chunks = Number(metadata.cart_items_chunks);
    let combinedJson = '';
    for (let i = 0; i < chunks; i++) {
      combinedJson += metadata[`cart_items_${i}`] || '';
    }
    try {
      cartItems = JSON.parse(combinedJson);
      console.log(`✅ [DEFERRED] Parsed ${cartItems.length} cart items from ${chunks} metadata chunks`);
    } catch (e) {
      console.error(`❌ [DEFERRED] Failed to parse chunked cart_items:`, e);
    }
  }
  
  // Transform cart items to line_items format (matching what payment mode orders use)
  const transformedLineItems = cartItems.map((item: any) => ({
    product_id: item.product_id,
    title: item.name,
    quantity: item.quantity,
    unit_price: item.price,
    currency: 'usd',
    image_url: item.image_url,
    recipient_id: item.recipient_id || null,
    recipient_name: item.recipient_name || '',
    gift_message: item.gift_message || '',
    wishlist_id: item.wishlist_id || '',
    wishlist_item_id: item.wishlist_item_id || '',
    recipient_shipping: item.recipient_shipping || null,
  }));
  
  const lineItems = {
    items: transformedLineItems,
    subtotal: Number(metadata.subtotal) || 0,
    shipping: Number(metadata.shipping_cost) || 0,
    tax: Number(metadata.tax_amount) || 0,
    gifting_fee: Number(metadata.gifting_fee) || 0,
  };
  
  const scheduledDate = metadata.scheduled_delivery_date || null;
  const isAutoGift = metadata.is_auto_gift === 'true';
  const autoGiftRuleId = metadata.auto_gift_rule_id || null;
  
  // Create the pending_payment order
  // Note: payment_method_id will be populated by scheduled-order-processor when it fetches the setup intent
  const orderData = {
    user_id: userId,
    checkout_session_id: sessionId,
    setup_intent_id: setupIntentId, // Store setup intent for later payment method retrieval
    payment_intent_id: null, // Will be created when we authorize at T-7
    stripe_customer_id: stripeCustomerId,
    status: 'pending_payment', // NEW STATUS: Card saved, no authorization yet
    payment_status: 'pending',
    total_amount: totalAmount,
    currency: session.currency || 'usd',
    line_items: lineItems,
    shipping_address: shippingAddress,
    gift_options: {
      isGift: !!metadata.gift_message || isAutoGift || transformedLineItems.some(item => item.recipient_id),
      giftMessage: metadata.gift_message || '',
      giftWrapping: false,
      isSurpriseGift: false,
    },
    scheduled_delivery_date: scheduledDate,
    is_auto_gift: isAutoGift,
    auto_gift_rule_id: autoGiftRuleId,
    notes: JSON.stringify({
      deferred_payment: true,
      original_days_until_delivery: metadata.days_until_delivery || 'unknown',
      setup_intent_id: setupIntentId,
    }),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  
  const { data: newOrder, error: insertError } = await supabase
    .from('orders')
    .insert(orderData)
    .select('id, order_number, status')
    .single();
  
  if (insertError) {
    console.error(`❌ [DEFERRED] Failed to create pending_payment order:`, insertError);
    throw new Error(`Failed to create deferred order: ${insertError.message}`);
  }
  
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`✅ [DEFERRED] Pending payment order created in ${elapsed}s: ${newOrder.id} | Number: ${newOrder.order_number}`);
  console.log(`📅 [DEFERRED] Scheduled delivery: ${scheduledDate} | Will authorize at T-7`);
  
  // Trigger confirmation email (no payment yet, but order is placed)
  try {
    await supabase.functions.invoke('ecommerce-email-orchestrator', {
      body: {
        eventType: 'order_pending_payment',
        orderId: newOrder.id,
        recipientEmail: metadata.user_email,
        metadata: {
          order_number: newOrder.order_number,
          scheduled_date: scheduledDate,
          total_amount: totalAmount,
        }
      }
    });
    console.log(`📧 [DEFERRED] Pending payment confirmation email triggered`);
  } catch (emailErr: any) {
    console.warn(`⚠️ [DEFERRED] Email trigger failed (non-fatal):`, emailErr.message);
  }
}

// ============================================================================
// HELPER: Trigger order processing WITH RETRY AND VERIFICATION
// ============================================================================
async function triggerOrderProcessingWithRetry(orderId: string, supabase: any, userId: string) {
  const maxRetries = 2;
  const verificationDelayMs = 3000; // Wait 3 seconds before verification
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 [${new Date().toISOString()}] Attempt ${attempt}/${maxRetries}: Invoking process-order-v2 for ${orderId}...`);
      
      const { data, error } = await supabase.functions.invoke('process-order-v2', {
        body: { orderId, userId }
      });

      if (error) {
        console.error(`❌ [${new Date().toISOString()}] process-order-v2 invocation error (attempt ${attempt}):`, error);
        
        if (attempt === maxRetries) {
          throw new Error(`Failed to invoke process-order-v2 after ${maxRetries} attempts: ${error.message}`);
        }
        
        console.log(`⏳ Retrying in 2 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        continue;
      }

      console.log(`✅ [${new Date().toISOString()}] process-order-v2 invoked successfully (attempt ${attempt})`);
      
      // CRITICAL: Verify that Zinc submission actually happened
      console.log(`🔍 [${new Date().toISOString()}] Verifying Zinc submission in ${verificationDelayMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, verificationDelayMs));
      
      const { data: verifiedOrder, error: verifyError } = await supabase
        .from('orders')
        .select('zinc_order_id, zinc_request_id, status')
        .eq('id', orderId)
        .single();

      if (verifyError) {
        console.error(`❌ [${new Date().toISOString()}] Verification query failed:`, verifyError);
        throw new Error('Failed to verify order after processing');
      }

      if (!verifiedOrder.zinc_order_id && !verifiedOrder.zinc_request_id) {
        console.error(`❌ [${new Date().toISOString()}] VERIFICATION FAILED: Order ${orderId} has no Zinc IDs despite successful invocation`);
        
        if (attempt === maxRetries) {
          throw new Error('Order processing verification failed - Zinc IDs not populated');
        }
        
        console.log(`⏳ Retrying processing...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        continue;
      }

      console.log(`✅ [${new Date().toISOString()}] VERIFIED: Order ${orderId} successfully submitted to Zinc | Request: ${verifiedOrder.zinc_request_id} | Order: ${verifiedOrder.zinc_order_id}`);
      return; // Success!
      
    } catch (err: any) {
      console.error(`❌ [${new Date().toISOString()}] Processing attempt ${attempt} failed:`, err.message);
      
      if (attempt === maxRetries) {
        throw err;
      }
      
      console.log(`⏳ Retrying in 2 seconds...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
}

// ============================================================================
// LEGACY: Keep old function for backward compatibility but add logging
// ============================================================================
async function triggerOrderProcessing(orderId: string, supabase: any, userId: string) {
  console.log(`⚠️ [${new Date().toISOString()}] LEGACY: Using triggerOrderProcessing without retry. Consider using triggerOrderProcessingWithRetry.`);
  try {
    console.log(`🚀 Triggering process-order-v2 for order ${orderId}...`);
    
    const { error } = await supabase.functions.invoke('process-order-v2', {
      body: { orderId }
    });
    
    if (error) {
      console.error(`❌ process-order-v2 error:`, error);
      await supabase
        .from('orders')
        .update({
          status: 'requires_attention',
          funding_hold_reason: `Failed to trigger processing: ${error.message}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);
    } else {
      console.log(`✅ process-order-v2 triggered successfully`);
    }
  } catch (err: any) {
    console.error(`❌ Failed to trigger process-order-v2:`, err.message);
  }
}
