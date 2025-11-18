// Define Supabase functions enum to avoid direct string references
export enum SUPABASE_FUNCTIONS {
  // Product catalog functions
  GET_PRODUCTS = "get-products",
  GET_PRODUCT_DETAIL = "get-product-detail",
  GET_SHIPPING_QUOTE = "get-shipping-quote",
  
  // Core V2 payment & order functions
  CREATE_CHECKOUT_SESSION = "create-checkout-session",
  STRIPE_WEBHOOK_V2 = "stripe-webhook-v2",
  PROCESS_ORDER_V2 = "process-order-v2",
  SCHEDULED_ORDER_PROCESSOR = "scheduled-order-processor",
  AUTO_GIFT_ORCHESTRATOR = "auto-gift-orchestrator",
  ORDER_MONITOR_V2 = "order-monitor-v2",
  RECONCILE_CHECKOUT_SESSION = "reconcile-checkout-session",
  
  // Address & recipient functions
  COLLECT_RECIPIENT_ADDRESS = "collect-recipient-address",
  
  // Email system
  ECOMMERCE_EMAIL_ORCHESTRATOR = "ecommerce-email-orchestrator",
  PROCESS_EMAIL_QUEUE = "process-email-queue",
  
  // Nicole AI agent
  NICOLE_CHATGPT_AGENT = "nicole-chatgpt-agent",
}
