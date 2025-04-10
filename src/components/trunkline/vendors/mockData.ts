
import { Vendor } from "./types";

export const mockVendors: Vendor[] = [
  {
    id: "v1",
    name: "Eco Friendly Products",
    productCategories: ["Home", "Kitchen", "Garden"],
    joinDate: "2025-01-15",
    status: "active",
    stripeConnected: true,
    productsListed: 45,
    totalSales: 15250
  },
  {
    id: "v2",
    name: "Fashion Forward",
    productCategories: ["Clothing", "Accessories"],
    joinDate: "2025-02-20",
    status: "active",
    stripeConnected: true,
    productsListed: 78,
    totalSales: 27890
  },
  {
    id: "v3",
    name: "Tech Innovations",
    productCategories: ["Electronics", "Gadgets"],
    joinDate: "2025-03-05",
    status: "active",
    stripeConnected: false,
    productsListed: 32,
    totalSales: 42150
  },
  {
    id: "v4",
    name: "Handmade Crafts",
    productCategories: ["Art", "Crafts", "Home Decor"],
    joinDate: "2025-01-30",
    status: "pending",
    stripeConnected: false,
    productsListed: 18,
    totalSales: 5670
  }
];
