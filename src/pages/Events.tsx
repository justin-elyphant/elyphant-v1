
import React, { useState } from "react";
import UpcomingEvents from "@/components/gifting/UpcomingEvents";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import AddEventDialog from "@/components/gifting/events/add-dialog/AddEventDialog";

const Events = () => {
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);

  const handleAddEvent = () => {
    setIsAddEventOpen(true);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Gift Occasions</h1>
        <p className="text-muted-foreground mt-2">
          Track important dates and automate gift-giving for your loved ones
        </p>
      </div>
      
      <Tabs defaultValue="upcoming" className="mb-8">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming Events</TabsTrigger>
          <TabsTrigger value="past">Past Events</TabsTrigger>
          <TabsTrigger value="automated">Automated Gifting</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upcoming">
          <UpcomingEvents onAddEvent={handleAddEvent} />
        </TabsContent>
        
        <TabsContent value="past">
          <div className="text-center py-12 bg-white rounded-md shadow-sm">
            <h3 className="text-lg font-medium mb-2">No past events</h3>
            <p className="text-muted-foreground">
              Your gift history will appear here once you've sent gifts
            </p>
          </div>
        </TabsContent>
        
        <TabsContent value="automated">
          <div className="bg-white p-6 rounded-md shadow-sm">
            <h3 className="text-xl font-semibold mb-4">Automated Gifting Settings</h3>
            <p className="text-muted-foreground mb-6">
              Configure your preferences for automated gift-giving
            </p>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-md">
                <div>
                  <h4 className="font-medium">Notification Preferences</h4>
                  <p className="text-sm text-muted-foreground">Receive reminders before automated gifts are sent</p>
                </div>
                <Button variant="outline">Configure</Button>
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-md">
                <div>
                  <h4 className="font-medium">Budget Settings</h4>
                  <p className="text-sm text-muted-foreground">Set default budgets for different types of events</p>
                </div>
                <Button variant="outline">Manage Budgets</Button>
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-md">
                <div>
                  <h4 className="font-medium">Payment Methods</h4>
                  <p className="text-sm text-muted-foreground">Manage cards and payment options for auto-gifting</p>
                </div>
                <Button variant="outline">Add Payment Method</Button>
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
