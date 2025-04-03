
import React, { createContext, useContext, useState } from "react";
import { ExtendedEventData, FilterOption } from "../types";

// Mock data for upcoming events (moved from UpcomingEvents.tsx)
const upcomingEvents: ExtendedEventData[] = [
  {
    id: 1,
    type: "Birthday",
    person: "Alex Johnson",
    date: "May 15, 2023",
    daysAway: 14,
    avatarUrl: "/placeholder.svg",
    autoGiftEnabled: true,
    autoGiftAmount: 75,
    privacyLevel: "shared",
    isVerified: true,
    giftSource: "wishlist"
  },
  {
    id: 2,
    type: "Anniversary",
    person: "Jamie Smith",
    date: "June 22, 2023",
    daysAway: 30,
    avatarUrl: "/placeholder.svg",
    autoGiftEnabled: false,
    privacyLevel: "private",
    giftSource: "wishlist"
  },
  {
    id: 3,
    type: "Christmas",
    person: "Taylor Wilson",
    date: "December 25, 2023",
    daysAway: 90,
    avatarUrl: "/placeholder.svg",
    autoGiftEnabled: true,
    autoGiftAmount: 100,
    privacyLevel: "public",
    giftSource: "both"
  },
  {
    id: 4, 
    type: "Wedding Anniversary",
    person: "Chris & Robin",
    date: "July 15, 2023",
    daysAway: 45,
    avatarUrl: "/placeholder.svg",
    autoGiftEnabled: false,
    privacyLevel: "shared",
    isVerified: false,
    needsVerification: true,
    giftSource: "wishlist"
  }
];

type EventsContextProps = {
  events: ExtendedEventData[];
  setEvents: React.Dispatch<React.SetStateAction<ExtendedEventData[]>>;
  currentEvent: ExtendedEventData | null;
  setCurrentEvent: React.Dispatch<React.SetStateAction<ExtendedEventData | null>>;
  isEditDrawerOpen: boolean;
  setIsEditDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  viewMode: "cards" | "calendar";
  setViewMode: React.Dispatch<React.SetStateAction<"cards" | "calendar">>;
  selectedEventType: FilterOption;
  setSelectedEventType: React.Dispatch<React.SetStateAction<FilterOption>>;
};

const EventsContext = createContext<EventsContextProps | undefined>(undefined);

export const EventsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [events, setEvents] = useState<ExtendedEventData[]>(upcomingEvents);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<ExtendedEventData | null>(null);
  const [viewMode, setViewMode] = useState<"cards" | "calendar">("cards");
  const [selectedEventType, setSelectedEventType] = useState<FilterOption>("all");

  return (
    <EventsContext.Provider
      value={{
        events,
        setEvents,
        currentEvent,
        setCurrentEvent,
        isEditDrawerOpen,
        setIsEditDrawerOpen,
        viewMode,
        setViewMode,
        selectedEventType,
        setSelectedEventType,
      }}
    >
      {children}
    </EventsContext.Provider>
  );
};

export const useEvents = () => {
  const context = useContext(EventsContext);
  if (!context) {
    throw new Error("useEvents must be used within an EventsProvider");
  }
  return context;
};
