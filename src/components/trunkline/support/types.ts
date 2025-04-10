
// Define the support request status types
export type SupportStatus = 'open' | 'in_progress' | 'resolved' | 'vendor_action';

// Define a support request type
export interface SupportRequest {
  id: string;
  orderId: string;
  customerName: string;
  customerEmail: string;
  subject: string;
  status: SupportStatus;
  vendorName: string;
  createdAt: string;
  lastUpdated: string;
}
