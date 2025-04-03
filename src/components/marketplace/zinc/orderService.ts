
import { ZincOrder } from './types';

// Mock data for orders until we implement the full API
export const getMockOrders = (): ZincOrder[] => {
  return [
    {
      id: "ord_123456",
      customerName: "Jane Smith",
      items: [
        { name: "Echo Dot (4th Gen)", quantity: 1, price: 49.99 }
      ],
      total: 49.99,
      status: "delivered",
      date: "2025-03-28T14:30:00Z"
    },
    {
      id: "ord_123457",
      customerName: "John Doe",
      items: [
        { name: "Kindle Paperwhite", quantity: 1, price: 139.99 }
      ],
      total: 139.99,
      status: "shipped",
      date: "2025-04-01T10:15:00Z"
    },
    {
      id: "ord_123458",
      customerName: "Alex Johnson",
      items: [
        { name: "Fire TV Stick 4K", quantity: 1, price: 49.99 },
        { name: "AirPods Pro", quantity: 1, price: 249.99 }
      ],
      total: 299.98,
      status: "processing",
      date: "2025-04-02T16:45:00Z"
    }
  ];
};
