import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AdminCustomer {
  id: string;
  name: string | null;
  username: string | null;
  email: string | null;
  profile_image: string | null;
  profile_type: string | null;
  user_type: string | null;
  signup_source: string | null;
  onboarding_completed: boolean | null;
  city: string | null;
  state: string | null;
  has_purchased: boolean | null;
  has_given_gifts: boolean | null;
  has_wishlist: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface CustomerFilters {
  search?: string;
  hasOrders?: boolean;
  dateRange?: {
    from: Date;
    to: Date;
  };
}

export const useCustomers = () => {
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<CustomerFilters>({});

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: invokeError } = await supabase.functions.invoke(
        "trunkline-list-customers",
        {
          body: {
            search: filters.search || undefined,
            dateFrom: filters.dateRange?.from.toISOString(),
            dateTo: filters.dateRange?.to.toISOString(),
          },
        }
      );

      if (invokeError) throw invokeError;
      if (data?.error) throw new Error(data.error);

      setCustomers((data?.customers as AdminCustomer[]) || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch customers");
      console.error("Error fetching customers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [filters]);

  const getCustomerOrderHistory = async (customerId: string) => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          order_items(*)
        `)
        .eq("user_id", customerId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error("Error fetching customer order history:", err);
      return [];
    }
  };

  return {
    customers,
    loading,
    error,
    filters,
    setFilters,
    getCustomerOrderHistory,
    refetch: fetchCustomers,
  };
};
