
import React, { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import UpcomingEvents from "@/components/gifting/UpcomingEvents";
import PastEventsContainer from "@/components/gifting/events/past-events/PastEventsContainer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GiftSetupWizard } from "@/components/gifting/GiftSetupWizard";
import AutomatedGiftingTabContent from "@/components/gifting/events/automated-tab/AutomatedGiftingTabContent";
import AutoGiftExecutionMonitor from "@/components/gifting/auto-gift/AutoGiftExecutionMonitor";
import UnifiedGiftTimingDashboard from "@/components/gifting/unified/UnifiedGiftTimingDashboard";
import BackToDashboard from "@/components/shared/BackToDashboard";
import MainLayout from "@/components/layout/MainLayout";
import { useAuth } from "@/contexts/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { UserPlus } from "lucide-react";
import { EventsProvider, useEvents } from "@/components/gifting/events/context/EventsContext";

const Events = () => {
  const [isGiftWizardOpen, setIsGiftWizardOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

  // Check for action=add parameter on page load
  useEffect(() => {
    const action = searchParams.get("action");
    if (action === "add") {
      setIsGiftWizardOpen(true);
      // Clear the action parameter after opening the dialog
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete("action");
      setSearchParams(newSearchParams);
    }
  }, [searchParams, setSearchParams]);

  const handleAddEvent = () => {
    console.log("Set up gifting button clicked"); // Debug log
    setIsGiftWizardOpen(true);
  };

  // Show sign-in prompt if not authenticated
  if (!user) {
    return (
      <MainLayout>
        <div className="container mx-auto py-8 px-4">
          <BackToDashboard />
          
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
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <EventsProvider>
        <div className="container mx-auto py-8 px-4">
          <BackToDashboard />
          
          <div className="mb-6">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Gift Timing Hub</h1>
            <p className="text-muted-foreground mt-1">
              Manage automated event gifting and manual gift scheduling
            </p>
          </div>
          
          <EventsContent onAddEvent={handleAddEvent} />
          <GiftSetupWizard 
            open={isGiftWizardOpen} 
            onOpenChange={(open) => {
              console.log("Gift wizard open state changed:", open); // Debug log
              setIsGiftWizardOpen(open);
            }}
          />
        </div>
      </EventsProvider>
    </MainLayout>
  );
};

const EventsContent = ({ onAddEvent }: { onAddEvent: () => void }) => {
  const { events } = useEvents();
  const [searchParams] = useSearchParams();
  
  // Get default tab from URL parameter
  const defaultTab = searchParams.get("tab") || "overview";
  
  // Separate past and upcoming events
  const { upcomingEvents, pastEvents } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const upcoming = events.filter(event => {
      if (!event.dateObj) return true; // If no date object, consider upcoming
      return event.dateObj >= today;
    });
    
    const past = events.filter(event => {
      if (!event.dateObj) return false; // If no date object, not past
      return event.dateObj < today;
    });
    
    return { upcomingEvents: upcoming, pastEvents: past };
  }, [events]);

  return (
    <Tabs defaultValue={defaultTab} className="w-full">
      <div className="flex items-center justify-between">
        <TabsList className="h-10">
          <TabsTrigger value="overview" className="text-sm">
            Overview
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="text-sm">
            Upcoming Events ({upcomingEvents.length})
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
        
      <TabsContent value="upcoming" className="mt-6">
        <UpcomingEvents onAddEvent={onAddEvent} />
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
  );
};

export default Events;
