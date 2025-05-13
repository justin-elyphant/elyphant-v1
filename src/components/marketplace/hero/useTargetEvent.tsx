
import { useState, useEffect } from "react";
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

  // Find the closest event (holiday or friend event)
  useEffect(() => {
    // Default to the next holiday if available
    let closestEvent = nextHoliday;
    let closestDate = closestEvent?.date;
    
    // For logged in users, check if a friend event is closer
    if (user && friendOccasions.length > 0) {
      const sortedEvents = [...friendOccasions, ...(nextHoliday ? [nextHoliday] : [])]
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
      console.log("Setting target event to:", closestEvent.name, closestDate);
      setTargetEvent({
        name: closestEvent.name,
        date: closestDate,
        type: closestEvent.type
      });
    } else {
      console.log("No target event found");
    }
  }, [nextHoliday, friendOccasions, user]);

  return { targetEvent };
};

export default useTargetEvent;
