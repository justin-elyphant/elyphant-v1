
export interface Vendor {
  id: string;
  user_id: string;
  company_name: string;
  contact_email: string;
  approval_status: 'pending' | 'approved' | 'rejected' | 'suspended';
  approved_by: string | null;
  description: string | null;
  phone: string | null;
  website: string | null;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
  // Computed from joins
  products_count?: number;
  total_sales?: number;
}

export type VendorTabType = 'all' | 'pending' | 'marketing' | 'payouts';
