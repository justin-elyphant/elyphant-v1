
import { SupportRequest } from "./types";

// Mock data for support requests
export const mockRequests: SupportRequest[] = [
  {
    id: "sup_123456",
    orderId: "ord_789012",
    customerName: "Jane Smith",
    customerEmail: "jane.smith@example.com",
    subject: "Missing item in order",
    status: "open",
    vendorName: "Amazon via Zinc",
    createdAt: "2025-04-08T10:15:00Z",
    lastUpdated: "2025-04-08T10:15:00Z"
  },
  {
    id: "sup_123457",
    orderId: "ord_789013",
    customerName: "John Doe",
    customerEmail: "john.doe@example.com",
    subject: "Wrong size received",
    status: "in_progress",
    vendorName: "Nike",
    createdAt: "2025-04-07T14:30:00Z",
    lastUpdated: "2025-04-08T09:45:00Z"
  },
  {
    id: "sup_123458",
    orderId: "ord_789014",
    customerName: "Alex Johnson",
    customerEmail: "alex.johnson@example.com",
    subject: "Damaged packaging",
    status: "vendor_action",
    vendorName: "Adidas",
    createdAt: "2025-04-06T11:45:00Z",
    lastUpdated: "2025-04-07T13:20:00Z"
  },
  {
    id: "sup_123459",
    orderId: "ord_789015",
    customerName: "Sarah Williams",
    customerEmail: "sarah.williams@example.com",
    subject: "Return request help",
    status: "resolved",
    vendorName: "Apple",
    createdAt: "2025-04-05T09:30:00Z",
    lastUpdated: "2025-04-06T16:10:00Z"
  }
];
