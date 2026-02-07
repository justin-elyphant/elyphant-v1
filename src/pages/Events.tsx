
import React, { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import UpcomingEvents from "@/components/gifting/UpcomingEvents";
import PastEventsContainer from "@/components/gifting/events/past-events/PastEventsContainer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// AutoGiftSetupFlow removed - consolidated into UnifiedGiftSchedulingModal
import AutomatedGiftingTabContent from "@/components/gifting/events/automated-tab/AutomatedGiftingTabContent";
import AutoGiftExecutionMonitor from "@/components/gifting/auto-gift/AutoGiftExecutionMonitor";
import UnifiedGiftTimingDashboard from "@/components/gifting/unified/UnifiedGiftTimingDashboard";
import { useAuth } from "@/contexts/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { UserPlus, Info } from "lucide-react";
import { EventsProvider, useEvents } from "@/components/gifting/events/context/EventsContext";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Events = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

  const handleAddEvent = () => {
    console.log("Set up gifting button clicked");
  };

  // Show sign-in prompt if not authenticated
  if (!user) {
    return (
        <div className="container mx-auto py-8 px-4">
          
          <div className="mb-6">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Gift Timing Hub</h1>
          </div>

          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <UserPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Sign in required</h3>
                <p className="text-muted-foreground mb-4">
                  Please sign in to manage your events and gift timing preferences
                </p>
                <Button asChild>
                  <Link to="/sign-in">Sign In</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
    );
  }

  return (
      <EventsProvider>
        <div className="container mx-auto py-8 px-4">
          
          <div className="mb-6">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Gift Timing Hub</h1>
            <p className="text-muted-foreground mt-1">
              Manage automated event gifting and manual gift scheduling
            </p>
          </div>
          
          {/* Educational Alert */}
          <Alert className="mb-6 border-blue-200 bg-blue-50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>How it works:</strong> "My Events" are occasions where you receive gifts (your birthday, graduation, etc.) - share these so friends can set up auto-gifts for you. 
              "Upcoming Gifts" are for setting up gifts you'll send to others. "Shared Events" like anniversaries involve both giving and receiving.
            </AlertDescription>
          </Alert>
          
          <EventsContent onAddEvent={handleAddEvent} />
        </div>
      </EventsProvider>
  );
};

const EventsContent = ({ onAddEvent }: { onAddEvent: () => void }) => {
  const { events, isAutoGiftSetupOpen, setIsAutoGiftSetupOpen, autoGiftSetupInitialData, setAutoGiftSetupInitialData } = useEvents();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Check for action=add parameter on page load
  useEffect(() => {
    const action = searchParams.get("action");
    if (action === "add") {
      setIsAutoGiftSetupOpen(true);
      // Clear the action parameter after opening the dialog
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete("action");
      setSearchParams(newSearchParams);
    }
  }, [searchParams, setSearchParams, setIsAutoGiftSetupOpen]);

  const handleAddEventWithContext = () => {
    console.log("Set up gifting button clicked");
    setIsAutoGiftSetupOpen(true);
  };
  
  // Get default tab from URL parameter
  const defaultTab = searchParams.get("tab") || "overview";
  
  // Categorize events by type
  const { myEvents, upcomingGifts, sharedEvents, pastEvents } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const my = events.filter(event => event.eventCategory === 'self' && (!event.dateObj || event.dateObj >= today));
    const upcoming = events.filter(event => event.eventCategory === 'others' && (!event.dateObj || event.dateObj >= today));
    const shared = events.filter(event => event.eventCategory === 'shared' && (!event.dateObj || event.dateObj >= today));
    const past = events.filter(event => event.dateObj && event.dateObj < today);
    
    return { 
      myEvents: my, 
      upcomingGifts: upcoming, 
      sharedEvents: shared, 
      pastEvents: past 
    };
  }, [events]);

  return (
    <>
      <Tabs defaultValue={defaultTab} className="w-full">
        <div className="flex items-center justify-between">
          <TabsList className="h-10">
            <TabsTrigger value="overview" className="text-sm">
              Overview
            </TabsTrigger>
            <TabsTrigger value="my-events" className="text-sm">
              My Events ({myEvents.length})
            </TabsTrigger>
            <TabsTrigger value="upcoming-gifts" className="text-sm">
              Upcoming Gifts ({upcomingGifts.length})
            </TabsTrigger>
            <TabsTrigger value="shared-events" className="text-sm">
              Shared Events ({sharedEvents.length})
            </TabsTrigger>
            <TabsTrigger value="past" className="text-sm">
              Past Events ({pastEvents.length})
            </TabsTrigger>
            <TabsTrigger value="automated" className="text-sm">Automation Rules</TabsTrigger>
            <TabsTrigger value="monitoring" className="text-sm">Activity Log</TabsTrigger>
          </TabsList>
        </div>
          
        <TabsContent value="overview" className="mt-6">
          <UnifiedGiftTimingDashboard />
        </TabsContent>
          
        <TabsContent value="my-events" className="mt-6">
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">📅 My Events</h3>
              <p className="text-blue-800 text-sm">
                These are occasions where you receive gifts. Share these events with friends and family so they can 
                set up automatic gift reminders and deliveries for you. You won't set up auto-gifting for yourself here.
              </p>
            </div>
            <UpcomingEvents onAddEvent={handleAddEventWithContext} events={myEvents} />
          </div>
        </TabsContent>
          
        <TabsContent value="upcoming-gifts" className="mt-6">
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-medium text-green-900 mb-2">🎁 Upcoming Gifts</h3>
              <p className="text-green-800 text-sm">
                Set up automated gifting for friends and family. Configure budgets, preferences, and timing 
                to never miss an important occasion. Perfect for birthdays, graduations, and special milestones.
              </p>
            </div>
            <UpcomingEvents onAddEvent={handleAddEventWithContext} events={upcomingGifts} />
          </div>
        </TabsContent>

        <TabsContent value="shared-events" className="mt-6">
          <div className="space-y-4">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h3 className="font-medium text-purple-900 mb-2">💕 Shared Events</h3>
              <p className="text-purple-800 text-sm">
                Special occasions you celebrate together with someone special, like anniversaries with your partner 
                or Valentine's Day. Both people can give and receive gifts for these mutual celebrations.
              </p>
            </div>
            <UpcomingEvents onAddEvent={handleAddEventWithContext} events={sharedEvents} />
          </div>
        </TabsContent>
          
        <TabsContent value="past" className="mt-6">
          <PastEventsContainer pastEvents={pastEvents} />
        </TabsContent>
          
        <TabsContent value="automated" className="mt-6">
          <AutomatedGiftingTabContent />
        </TabsContent>
          
        <TabsContent value="monitoring" className="mt-6">
          <AutoGiftExecutionMonitor />
        </TabsContent>
      </Tabs>
      
      {/* Gift Setup integrated into Nicole AI flow */}
    </>
  );
};

export default Events;
