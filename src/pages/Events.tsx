
import React, { useState } from "react";
import UpcomingEvents from "@/components/gifting/UpcomingEvents";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AddEventDialog from "@/components/gifting/events/add-dialog/AddEventDialog";
import { Button } from "@/components/ui/button";
import BackToDashboard from "@/components/shared/BackToDashboard";

const Events = () => {
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);

  const handleAddEvent = () => {
    setIsAddEventOpen(true);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <BackToDashboard />
      
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Auto-gifting Hub</h1>
      </div>
      
      <Tabs defaultValue="upcoming" className="w-full">
        <div className="flex items-center justify-between">
          <TabsList className="h-10">
            <TabsTrigger value="upcoming" className="text-sm">Upcoming Events</TabsTrigger>
            <TabsTrigger value="past" className="text-sm">Past Events</TabsTrigger>
            <TabsTrigger value="automated" className="text-sm">Automated Gifting</TabsTrigger>
          </TabsList>
        </div>
          
        <TabsContent value="upcoming" className="mt-6">
          <UpcomingEvents onAddEvent={handleAddEvent} />
        </TabsContent>
          
        <TabsContent value="past">
          <div className="text-center py-12 bg-card rounded-md border shadow-sm">
            <h3 className="text-lg font-medium mb-2">No past events</h3>
            <p className="text-muted-foreground text-sm">
              Your gift history will appear here once you've sent gifts
            </p>
          </div>
        </TabsContent>
          
        <TabsContent value="automated">
          <div className="bg-card p-6 rounded-md border shadow-sm">
            <h3 className="text-xl font-semibold mb-4">Automated Gifting Settings</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Configure your preferences for automated gift-giving
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-background rounded-md border">
                <div>
                  <h4 className="font-medium text-sm">Notification Preferences</h4>
                  <p className="text-xs text-muted-foreground mt-1">Receive reminders before automated gifts are sent</p>
                </div>
                <Button variant="outline" size="sm">Configure</Button>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-background rounded-md border">
                <div>
                  <h4 className="font-medium text-sm">Budget Settings</h4>
                  <p className="text-xs text-muted-foreground mt-1">Set default budgets for different types of events</p>
                </div>
                <Button variant="outline" size="sm">Manage Budgets</Button>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-background rounded-md border">
                <div>
                  <h4 className="font-medium text-sm">Payment Methods</h4>
                  <p className="text-xs text-muted-foreground mt-1">Manage cards and payment options for auto-gifting</p>
                </div>
                <Button variant="outline" size="sm">Add Payment Method</Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
      
      <AddEventDialog 
        open={isAddEventOpen} 
        onOpenChange={setIsAddEventOpen} 
      />
    </div>
  );
};

export default Events;
