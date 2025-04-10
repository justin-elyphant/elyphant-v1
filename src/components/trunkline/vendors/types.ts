
export interface Vendor {
  id: string;
  name: string;
  productCategories: string[];
  joinDate: string;
  status: 'active' | 'pending' | 'inactive';
  stripeConnected: boolean;
  productsListed: number;
  totalSales: number;
}

export type VendorTabType = 'all' | 'marketing' | 'payouts';
