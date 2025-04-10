
// Define the support request status types
export type VendorSupportStatus = 'pending_vendor' | 'in_progress' | 'resolved';

// Define a support request type
export interface VendorSupportRequest {
  id: string;
  orderId: string;
  customerName: string;
  subject: string;
  status: VendorSupportStatus;
  hasReturn: boolean;
  dateCreated: string;
  lastMessage: string;
  lastMessageDate: string;
}
