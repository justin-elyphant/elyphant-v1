import { supabase } from "@/integrations/supabase/client";
import { SUPABASE_FUNCTIONS } from "@/integrations/supabase/function-types";

interface EmailQueueResponse {
  success: boolean;
  message: string;
  processed: number;
  errors: number;
  total: number;
}

export async function processEmailQueueNow(force: boolean = true): Promise<EmailQueueResponse> {
  const { data, error } = await supabase.functions.invoke(
    `${SUPABASE_FUNCTIONS.PROCESS_EMAIL_QUEUE}${force ? '?force=true' : ''}`
  );

  if (error) {
    throw error;
  }

  return data as EmailQueueResponse;
}
