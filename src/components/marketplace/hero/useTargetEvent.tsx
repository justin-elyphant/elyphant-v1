
import { useState, useEffect, useMemo } from "react";
import { GiftOccasion } from "../utils/upcomingOccasions";
import { User } from "@supabase/supabase-js";

interface TargetEventHook {
  targetEvent: {
    name: string;
    date: Date;
    type: string;
  } | null;
}

export const useTargetEvent = (
  user: User | null,
  nextHoliday: GiftOccasion | null,
  upcomingHolidays: GiftOccasion[],
  friendOccasions: GiftOccasion[]
): TargetEventHook => {
  const [targetEvent, setTargetEvent] = useState<{
    name: string;
    date: Date;
    type: string;
  } | null>(null);

  // Memoize the friendOccasions array to prevent infinite re-renders
  const memoizedFriendOccasions = useMemo(() => friendOccasions, [
    friendOccasions.length,
    friendOccasions.map(f => f.date.getTime()).join(',')
  ]);

  // Memoize nextHoliday to prevent infinite re-renders
  const memoizedNextHoliday = useMemo(() => nextHoliday, [
    nextHoliday?.name,
    nextHoliday?.date?.getTime(),
    nextHoliday?.type
  ]);

  // Find the closest event (holiday or friend event)
  useEffect(() => {
    // Default to the next holiday if available
    let closestEvent = memoizedNextHoliday;
    let closestDate = closestEvent?.date;
    
    // For logged in users, check if a friend event is closer
    if (user && memoizedFriendOccasions.length > 0) {
      const sortedEvents = [...memoizedFriendOccasions, ...(memoizedNextHoliday ? [memoizedNextHoliday] : [])]
        .filter(event => {
          // Ensure it's a future event by comparing timestamp values
          return event.date.getTime() > new Date().getTime();
        })
        .sort((a, b) => a.date.getTime() - b.date.getTime());
      
      if (sortedEvents.length > 0) {
        closestEvent = sortedEvents[0];
        closestDate = closestEvent.date;
      }
    }
    
    if (closestEvent && closestDate) {
      // Only log once when event actually changes
      if (!targetEvent || targetEvent.name !== closestEvent.name || targetEvent.date.getTime() !== closestDate.getTime()) {
        console.log("Setting target event to:", closestEvent.name, closestDate);
        setTargetEvent({
          name: closestEvent.name,
          date: closestDate,
          type: closestEvent.type
        });
      }
    } else if (targetEvent !== null) {
      console.log("No target event found");
      setTargetEvent(null);
    }
  }, [memoizedNextHoliday, memoizedFriendOccasions, user?.id, targetEvent]);

  return { targetEvent };
};

export default useTargetEvent;
