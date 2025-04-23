
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
    },
    {
      id: "ord_123459",
      customerName: "Sarah Williams",
      items: [
        { name: "Nintendo Switch", quantity: 1, price: 299.99 }
      ],
      total: 299.99,
      status: "delivered",
      date: "2025-03-15T09:20:00Z"
    },
    {
      id: "ord_123460",
      customerName: "Michael Brown",
      items: [
        { name: "Samsung 55\" 4K TV", quantity: 1, price: 599.99 }
      ],
      total: 599.99,
      status: "shipped",
      date: "2025-04-05T11:30:00Z"
    },
    {
      id: "ord_123461",
      customerName: "Emily Davis",
      items: [
        { name: "Apple Watch Series 7", quantity: 1, price: 399.99 }
      ],
      total: 399.99,
      status: "processing",
      date: "2025-04-10T14:15:00Z"
    },
    {
      id: "ord_123462",
      customerName: "David Miller",
      items: [
        { name: "Sony WH-1000XM4 Headphones", quantity: 1, price: 349.99 }
      ],
      total: 349.99,
      status: "delivered",
      date: "2025-03-22T16:40:00Z"
    },
    {
      id: "ord_123463",
      customerName: "Jennifer Wilson",
      items: [
        { name: "iPad Pro 11\"", quantity: 1, price: 799.99 }
      ],
      total: 799.99,
      status: "shipped",
      date: "2025-04-08T10:05:00Z"
    }
  ];
};
