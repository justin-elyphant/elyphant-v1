
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth";
import { useConnections } from "@/hooks/useConnections";
import { GiftOccasion } from "@/components/marketplace/utils/upcomingOccasions";
import { addDays, format, parseISO } from "date-fns";

// Mock data for development until connected to real data
const MOCK_FRIEND_DATES = [
  {
    id: "1",
    userId: "friend-1",
    name: "John Smith",
    avatar: "https://i.pravatar.cc/150?img=1",
    dateType: "birthday",
    date: "2025-05-20", // May 20
    visibility: "friends"
  },
  {
    id: "2",
    userId: "friend-2",
    name: "Emma Wilson",
    avatar: "https://i.pravatar.cc/150?img=2",
    dateType: "anniversary",
    date: "2025-06-15", // June 15
    visibility: "friends"
  },
  {
    id: "3", 
    userId: "friend-3",
    name: "Michael Davis",
    avatar: "https://i.pravatar.cc/150?img=3",
    dateType: "birthday",
    date: "2025-05-25", // May 25
    visibility: "friends"
  }
];

export const useConnectedFriendsSpecialDates = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [friendOccasions, setFriendOccasions] = useState<GiftOccasion[]>([]);
  const { connections, isLoading: connectionsLoading } = useConnections();

  useEffect(() => {
    const loadFriendOccasions = async () => {
      setLoading(true);
      
      try {
        // In a real app, we would fetch from Supabase using connections
        // For now, we'll use mock data
        const currentDate = new Date();
        const ninety_days_later = addDays(currentDate, 90);
        
        // Process mock data
        const occasions: GiftOccasion[] = [];
        
        MOCK_FRIEND_DATES.forEach(friend => {
          // Parse date and set current year
          const originalDate = parseISO(friend.date);
          const currentYear = new Date().getFullYear();
          
          // Create date for this year
          const thisYearDate = new Date(currentYear, originalDate.getMonth(), originalDate.getDate());
          
          // If this year's date is in the past, use next year
          const dateToUse = thisYearDate < currentDate 
            ? new Date(currentYear + 1, originalDate.getMonth(), originalDate.getDate())
            : thisYearDate;
            
          // Only include if within 90 days
          if (dateToUse <= ninety_days_later) {
            occasions.push({
              name: `${friend.name}'s ${friend.dateType}`,
              searchTerm: `${friend.dateType} gift`,
              date: dateToUse,
              type: friend.dateType === "birthday" ? "birthday" : "anniversary",
              personId: friend.userId,
              personName: friend.name,
              personImage: friend.avatar
            });
          }
        });
        
        // Sort by date (closest first)
        occasions.sort((a, b) => a.date.getTime() - b.date.getTime());
        setFriendOccasions(occasions);
        
      } catch (error) {
        console.error("Error loading friend occasions:", error);
      } finally {
        setLoading(false);
      }
    };
    
    // Only load if we have a user
    if (user && !connectionsLoading) {
      loadFriendOccasions();
    }
  }, [user, connections, connectionsLoading]);
  
  return {
    friendOccasions,
    loading
  };
};
