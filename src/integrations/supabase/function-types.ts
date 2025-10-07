
// Define Supabase functions enum to avoid direct string references
export enum SUPABASE_FUNCTIONS {
  GET_PRODUCTS = "get-products",
  GET_PRODUCT_DETAIL = "get-product-detail",
  TEST_ZINC_API_KEY = "test-zinc-api-key",
  SMS_GIFTEE_DISCOVERY = "sms-giftee-discovery",
  SEND_INVITATION_EMAIL = "send-invitation-email",
  HANDLE_INVITATION_ACCEPTANCE = "handle-invitation-acceptance",
  NICOLE_CHATGPT_AGENT = "nicole-chatgpt-agent",
  SIMPLE_ORDER_PROCESSOR = "simple-order-processor",
  CLEANUP_DUPLICATE_ORDERS = "cleanup-duplicate-orders",
  SEND_PASSWORD_CHANGE_NOTIFICATION = "send-password-change-notification",
  ECOMMERCE_EMAIL_ORCHESTRATOR = "ecommerce-email-orchestrator",
  TEST_EMAIL_SYSTEM = "test-email-system"
  // Note: Simplified order processing - removed complex orchestrator
}
