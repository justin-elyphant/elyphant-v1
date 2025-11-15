// Define Supabase functions enum to avoid direct string references
export enum SUPABASE_FUNCTIONS {
  GET_PRODUCTS = "get-products",
  GET_PRODUCT_DETAIL = "get-product-detail",
  GET_SHIPPING_QUOTE = "get-shipping-quote",
  TEST_ZINC_API_KEY = "test-zinc-api-key",
  SMS_GIFTEE_DISCOVERY = "sms-giftee-discovery",
  HANDLE_INVITATION_ACCEPTANCE = "handle-invitation-acceptance",
  NICOLE_CHATGPT_AGENT = "nicole-chatgpt-agent",
  SIMPLE_ORDER_PROCESSOR = "simple-order-processor",
  CLEANUP_DUPLICATE_ORDERS = "cleanup-duplicate-orders",
  ECOMMERCE_EMAIL_ORCHESTRATOR = "ecommerce-email-orchestrator",
  CLEAR_USER_CART_SESSIONS = "clear-user-cart-sessions",
  COLLECT_RECIPIENT_ADDRESS = "collect-recipient-address",
  DELETE_USER_ACCOUNT = "delete-user-account",
  CREATE_CHECKOUT_SESSION = "create-checkout-session",
  AUTO_GIFT_ORCHESTRATOR = "auto-gift-orchestrator",
  PROCESS_AUTO_GIFTS = "process-auto-gifts",
  STRIPE_WEBHOOK_V2 = "stripe-webhook-v2",
  PROCESS_ORDER_V2 = "process-order-v2",
  SEND_ORDER_RECEIPT = "send-order-receipt",
  ORDER_MONITOR_V2 = "order-monitor-v2",
  SCHEDULED_ORDER_PROCESSOR = "scheduled-order-processor"
}
