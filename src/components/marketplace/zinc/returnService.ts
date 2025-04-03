
import { ZincReturn } from './types';

export const getMockReturns = (): ZincReturn[] => {
  return [
    {
      id: "ret_789012",
      orderId: "ord_123456",
      customerName: "Jane Smith",
      item: { name: "Echo Dot (4th Gen)", price: 49.99 },
      reason: "Defective product",
      status: "completed",
      requestDate: "2025-03-30T11:30:00Z",
      completionDate: "2025-04-02T14:45:00Z",
      refundAmount: 49.99,
      creditIssued: true
    },
    {
      id: "ret_789013",
      orderId: "ord_123457",
      customerName: "John Doe",
      item: { name: "Kindle Paperwhite", price: 139.99 },
      reason: "Changed mind",
      status: "in_transit",
      requestDate: "2025-04-02T09:15:00Z",
      completionDate: null,
      refundAmount: null,
      creditIssued: false
    },
    {
      id: "ret_789014",
      orderId: "ord_123458",
      customerName: "Alex Johnson",
      item: { name: "AirPods Pro", price: 249.99 },
      reason: "Incorrect item",
      status: "pending",
      requestDate: "2025-04-03T10:30:00Z",
      completionDate: null,
      refundAmount: null,
      creditIssued: false
    }
  ];
};
