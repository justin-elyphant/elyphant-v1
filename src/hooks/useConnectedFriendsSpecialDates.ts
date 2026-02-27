
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth";
import { useEnhancedConnections } from "@/hooks/profile/useEnhancedConnections";
import { GiftOccasion } from "@/components/marketplace/utils/upcomingOccasions";
import { addDays } from "date-fns";

export const useConnectedFriendsSpecialDates = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [friendOccasions, setFriendOccasions] = useState<GiftOccasion[]>([]);
  const { connections } = useEnhancedConnections();

  useEffect(() => {
    const loadFriendOccasions = () => {
      setLoading(true);

      try {
        const now = new Date();
        const cutoff = addDays(now, 90);
        const currentYear = now.getFullYear();
        const occasions: GiftOccasion[] = [];

        for (const conn of connections) {
          // Only accepted connections
          if (conn.status !== "accepted") continue;

          const otherUserId = conn.display_user_id || (conn.user_id === user?.id ? conn.connected_user_id : conn.user_id);
          const name = conn.profile_name || "Friend";

          // --- Birthday from profile_dob (MM-DD format) ---
          if (conn.profile_dob) {
            const parts = conn.profile_dob.split("-").map(Number);
            if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
              const [month, day] = parts;
              let nextBirthday = new Date(currentYear, month - 1, day, 12, 0, 0);
              if (nextBirthday < now) {
                nextBirthday = new Date(currentYear + 1, month - 1, day, 12, 0, 0);
              }
              if (nextBirthday <= cutoff) {
                occasions.push({
                  name: `${name}'s birthday`,
                  searchTerm: "birthday gift",
                  date: nextBirthday,
                  type: "birthday",
                  personId: otherUserId || undefined,
                  personName: name,
                  personImage: conn.profile_image || undefined,
                });
              }
            }
          }

          // --- Important dates (anniversaries, etc.) ---
          if (Array.isArray(conn.profile_important_dates)) {
            for (const entry of conn.profile_important_dates) {
              if (!entry?.date) continue;
              const label = entry.description || entry.label || "special day";
              const raw = typeof entry.date === "string" ? entry.date : entry.date?.iso;
              if (!raw) continue;

              const parsed = new Date(raw);
              if (isNaN(parsed.getTime())) continue;

              let nextDate = new Date(currentYear, parsed.getMonth(), parsed.getDate(), 12, 0, 0);
              if (nextDate < now) {
                nextDate = new Date(currentYear + 1, parsed.getMonth(), parsed.getDate(), 12, 0, 0);
              }
              if (nextDate <= cutoff) {
                const type = label.toLowerCase().includes("anniversary") ? "anniversary" : "custom";
                occasions.push({
                  name: `${name}'s ${label}`,
                  searchTerm: `${type === "anniversary" ? "anniversary" : label} gift`,
                  date: nextDate,
                  type,
                  personId: otherUserId || undefined,
                  personName: name,
                  personImage: conn.profile_image || undefined,
                });
              }
            }
          }
        }

        occasions.sort((a, b) => a.date.getTime() - b.date.getTime());
        setFriendOccasions(occasions);
      } catch (error) {
        console.error("Error loading friend occasions:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadFriendOccasions();
    }
  }, [user, connections]);

  return { friendOccasions, loading };
};
