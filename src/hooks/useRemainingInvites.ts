import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useRemainingInvites = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["remaining-invites"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { remaining: 0, isUnlimited: false };

      const { data: result, error } = await supabase.rpc(
        "get_remaining_invites" as any,
        { p_user_id: user.id }
      );

      if (error) {
        console.error("Failed to fetch remaining invites:", error);
        return { remaining: 0, isUnlimited: false };
      }

      const value = Number(result);
      return {
        remaining: value === -1 ? Infinity : value,
        isUnlimited: value === -1,
      };
    },
  });

  return {
    remaining: data?.remaining ?? 0,
    isUnlimited: data?.isUnlimited ?? false,
    isLoading,
  };
};
