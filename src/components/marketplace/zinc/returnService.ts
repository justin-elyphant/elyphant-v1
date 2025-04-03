
import { ZincReturn } from './types';

export const getMockReturns = (): ZincReturn[] => {
  return [
    {
      id: "ret_789012",
      order_id: "ord_123456",
      orderId: "ord_123456",
      customerName: "Jane Smith",
      item: { name: "Echo Dot (4th Gen)", price: 49.99 },
      reason: "Defective product",
      status: "completed",
      requestDate: "2025-03-30T11:30:00Z",
      completionDate: "2025-04-02T14:45:00Z",
      refund_amount: 49.99,
      refund_status: "completed",
      created_at: "2025-03-30T11:30:00Z",
      updated_at: "2025-04-02T14:45:00Z",
      items: [{ product_id: "prod_123", quantity: 1, reason: "Defective product" }],
      creditIssued: true
    },
    {
      id: "ret_789013",
      order_id: "ord_123457",
      orderId: "ord_123457",
      customerName: "John Doe",
      item: { name: "Kindle Paperwhite", price: 139.99 },
      reason: "Changed mind",
      status: "in_transit",
      requestDate: "2025-04-02T09:15:00Z",
      completionDate: null,
      refund_amount: null,
      refund_status: "pending",
      created_at: "2025-04-02T09:15:00Z",
      updated_at: "2025-04-02T09:15:00Z",
      items: [{ product_id: "prod_456", quantity: 1, reason: "Changed mind" }],
      creditIssued: false
    },
    {
      id: "ret_789014",
      order_id: "ord_123458",
      orderId: "ord_123458",
      customerName: "Alex Johnson",
      item: { name: "AirPods Pro", price: 249.99 },
      reason: "Incorrect item",
      status: "pending",
      requestDate: "2025-04-03T10:30:00Z",
      completionDate: null,
      refund_amount: null,
      refund_status: null,
      created_at: "2025-04-03T10:30:00Z",
      updated_at: "2025-04-03T10:30:00Z",
      items: [{ product_id: "prod_789", quantity: 1, reason: "Incorrect item" }],
      creditIssued: false
    }
  ];
};
