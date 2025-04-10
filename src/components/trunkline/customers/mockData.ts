
// Mock customer data for the Trunkline customer tab
export const mockCustomers = [
  {
    id: "cust-001",
    name: "Sarah Johnson",
    email: "sarah.j@example.com",
    phone: "+1 415-555-2671",
    status: "active",
    customerSince: "March 2023",
    lastActive: "2 days ago",
    avatar: "/placeholder.svg",
    orderCount: 8,
    totalSpent: "$742.55",
    returns: 1,
    paymentMethod: "Visa ending in 4582",
    addresses: [
      {
        type: "Shipping",
        street: "123 Main Street",
        city: "San Francisco",
        state: "CA",
        zip: "94107"
      },
      {
        type: "Billing",
        street: "123 Main Street",
        city: "San Francisco",
        state: "CA",
        zip: "94107"
      }
    ],
    orders: [
      { id: "ORD-7842", date: "Apr 12, 2024", status: "Delivered", total: "$159.99" },
      { id: "ORD-6723", date: "Mar 03, 2024", status: "Delivered", total: "$89.95" },
      { id: "ORD-5912", date: "Feb 17, 2024", status: "Delivered", total: "$215.45" }
    ],
    wishlists: [
      { id: "WSL-001", name: "Birthday Ideas", itemCount: 5 },
      { id: "WSL-002", name: "Holiday List", itemCount: 7 }
    ],
    supportRequests: [
      { id: "SR-3421", date: "Mar 28, 2024", status: "Resolved", subject: "Order delay inquiry" },
      { id: "SR-2910", date: "Jan 15, 2024", status: "Closed", subject: "Return request for ORD-4872" }
    ]
  },
  {
    id: "cust-002",
    name: "Michael Chen",
    email: "michael.c@example.com",
    phone: "+1 312-555-9483",
    status: "active",
    customerSince: "November 2022",
    lastActive: "5 hours ago",
    avatar: "/placeholder.svg",
    orderCount: 12,
    totalSpent: "$1,245.78",
    returns: 0,
    paymentMethod: "Mastercard ending in 8731",
    addresses: [
      {
        type: "Shipping",
        street: "456 Oak Avenue",
        city: "Chicago",
        state: "IL",
        zip: "60613"
      }
    ],
    orders: [
      { id: "ORD-8012", date: "Apr 25, 2024", status: "Shipped", total: "$124.50" },
      { id: "ORD-7593", date: "Mar 19, 2024", status: "Delivered", total: "$215.99" }
    ],
    wishlists: [
      { id: "WSL-023", name: "Tech Gadgets", itemCount: 12 }
    ],
    supportRequests: []
  }
];

// Types for the customer data
export type CustomerAddress = {
  type: string;
  street: string;
  city: string;
  state: string;
  zip: string;
};

export type CustomerOrder = {
  id: string;
  date: string;
  status: string;
  total: string;
};

export type CustomerWishlist = {
  id: string;
  name: string;
  itemCount: number;
};

export type CustomerSupportRequest = {
  id: string;
  date: string;
  status: string;
  subject: string;
};

export type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  customerSince: string;
  lastActive: string;
  avatar: string;
  orderCount: number;
  totalSpent: string;
  returns: number;
  paymentMethod: string;
  addresses: CustomerAddress[];
  orders: CustomerOrder[];
  wishlists: CustomerWishlist[];
  supportRequests: CustomerSupportRequest[];
};
