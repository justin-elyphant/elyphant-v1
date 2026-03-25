import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useBetaCredits = () => {
  const { data: balance = 0, isLoading, refetch } = useQuery({
    queryKey: ["beta-credit-balance"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;

      const { data, error } = await supabase.rpc("get_beta_credit_balance", {
        p_user_id: user.id,
      });

      if (error) {
        console.error("Failed to fetch beta credit balance:", error);
        return 0;
      }

      return Number(data) || 0;
    },
  });

  return { balance, isLoading, refetch };
};
