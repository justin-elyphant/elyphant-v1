import { supabase } from "@/integrations/supabase/client";

export interface ExportData {
  exportedAt: string;
  profile: Record<string, unknown> | null;
  wishlists: Record<string, unknown>[];
  orders: Record<string, unknown>[];
  connections: Record<string, unknown>[];
  emailPreferences: Record<string, unknown>[];
  privacySettings: Record<string, unknown> | null;
  specialDates: Record<string, unknown>[];
}

export async function exportUserData(userId: string): Promise<ExportData> {
  const [
    profileResult,
    wishlistsResult,
    ordersResult,
    connectionsResult,
    emailPrefsResult,
    privacyResult,
    specialDatesResult,
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).single(),
    supabase.from("wishlists").select("*, wishlist_items(*)").eq("user_id", userId),
    supabase
      .from("orders")
      .select("id, status, total_amount, created_at, line_items, gift_options")
      .eq("user_id", userId),
    supabase
      .from("user_connections")
      .select("id, connected_user_id, status, relationship_type, created_at")
      .eq("user_id", userId),
    supabase.from("email_preferences").select("*").eq("user_id", userId),
    supabase.from("privacy_settings").select("*").eq("user_id", userId).single(),
    supabase.from("user_special_dates").select("*").eq("user_id", userId),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    profile: (profileResult.data as Record<string, unknown>) ?? null,
    wishlists: (wishlistsResult.data as Record<string, unknown>[]) ?? [],
    orders: (ordersResult.data as Record<string, unknown>[]) ?? [],
    connections: (connectionsResult.data as Record<string, unknown>[]) ?? [],
    emailPreferences: (emailPrefsResult.data as Record<string, unknown>[]) ?? [],
    privacySettings: (privacyResult.data as Record<string, unknown>) ?? null,
    specialDates: (specialDatesResult.data as Record<string, unknown>[]) ?? [],
  };
}

export function downloadAsJson(data: ExportData, filename = "my-elyphant-data.json") {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
