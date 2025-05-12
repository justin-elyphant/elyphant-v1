
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Check if the current user has Facebook authentication connected
 */
export const hasFacebookAuth = async (): Promise<boolean> => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.app_metadata?.provider === 'facebook';
};

