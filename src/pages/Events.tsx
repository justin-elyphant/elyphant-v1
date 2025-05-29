
import React, { useState, useMemo } from "react";
import UpcomingEvents from "@/components/gifting/UpcomingEvents";
import PastEventsContainer from "@/components/gifting/events/past-events/PastEventsContainer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AddEventDialog from "@/components/gifting/events/add-dialog/AddEventDialog";
import AutomatedGiftingTabContent from "@/components/gifting/events/automated-tab/AutomatedGiftingTabContent";
import BackToDashboard from "@/components/shared/BackToDashboard";
import { useAuth } from "@/contexts/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { UserPlus } from "lucide-react";
import { useEvents } from "@/components/gifting/events/context/EventsContext";

const Events = () => {
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const { user } = useAuth();

  const handleAddEvent = () => {
    setIsAddEventOpen(true);
  };

  // Show sign-in prompt if not authenticated
  if (!user) {
    return (
      <div className="container mx-auto py-8 px-4">
        <BackToDashboard />
        
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Auto-gifting Hub</h1>
        </div>

        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <UserPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Sign in required</h3>
              <p className="text-muted-foreground mb-4">
                Please sign in to manage your events and auto-gifting preferences
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
      <EventsContent onAddEvent={handleAddEvent} />
      <AddEventDialog 
        open={isAddEventOpen} 
        onOpenChange={setIsAddEventOpen} 
      />
    </EventsProvider>
  );
};

const EventsProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="container mx-auto py-8 px-4">
      <BackToDashboard />
      
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Auto-gifting Hub</h1>
      </div>
      
      {children}
    </div>
  );
};

const EventsContent = ({ onAddEvent }: { onAddEvent: () => void }) => {
  const { events } = useEvents();
  
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
    <Tabs defaultValue="upcoming" className="w-full">
      <div className="flex items-center justify-between">
        <TabsList className="h-10">
          <TabsTrigger value="upcoming" className="text-sm">
            Upcoming Events ({upcomingEvents.length})
          </TabsTrigger>
          <TabsTrigger value="past" className="text-sm">
            Past Events ({pastEvents.length})
          </TabsTrigger>
          <TabsTrigger value="automated" className="text-sm">Automated Gifting</TabsTrigger>
        </TabsList>
      </div>
        
      <TabsContent value="upcoming" className="mt-6">
        <UpcomingEvents onAddEvent={onAddEvent} />
      </TabsContent>
        
      <TabsContent value="past" className="mt-6">
        <PastEventsContainer pastEvents={pastEvents} />
      </TabsContent>
        
      <TabsContent value="automated" className="mt-6">
        <AutomatedGiftingTabContent />
      </TabsContent>
    </Tabs>
  );
};

export default Events;
