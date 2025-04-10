
import { VendorSupportRequest } from "./types";

// Mock data for support requests
export const mockRequests: VendorSupportRequest[] = [
  {
    id: "sup_123456",
    orderId: "ord_789012",
    customerName: "Jane Smith",
    subject: "Missing item in order",
    status: "pending_vendor",
    hasReturn: false,
    dateCreated: "2025-04-08T10:15:00Z",
    lastMessage: "Customer reports a Portable Charger was missing from their order. Can you confirm if this item was shipped?",
    lastMessageDate: "2025-04-08T11:35:00Z",
  },
  {
    id: "sup_123457",
    orderId: "ord_789013",
    customerName: "John Doe",
    subject: "Wrong size received",
    status: "pending_vendor",
    hasReturn: true,
    dateCreated: "2025-04-07T14:30:00Z",
    lastMessage: "Customer received size L but ordered size M. They would like to return it for the correct size.",
    lastMessageDate: "2025-04-07T15:20:00Z",
  },
  {
    id: "sup_123458",
    orderId: "ord_789014",
    customerName: "Alex Johnson",
    subject: "Damaged packaging",
    status: "in_progress",
    hasReturn: false,
    dateCreated: "2025-04-06T11:45:00Z",
    lastMessage: "Item was received with damaged packaging. Customer wants to know if this affects the product warranty.",
    lastMessageDate: "2025-04-06T13:10:00Z",
  },
];
