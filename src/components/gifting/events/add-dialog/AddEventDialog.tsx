
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { AddEventForm } from "./AddEventForm";
import { EventFormData } from "./types";
import { eventsService, transformExtendedEventToDatabase } from "@/services/eventsService";
import { unifiedGiftManagementService } from "@/services/UnifiedGiftManagementService";
import { supabase } from "@/integrations/supabase/client";
import { useEvents } from "../context/EventsContext";
import AutoGiftSetupFlow from "@/components/gifting/auto-gift/AutoGiftSetupFlow";

interface AddEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AddEventDialog = ({ open, onOpenChange }: AddEventDialogProps) => {
  const { refreshEvents } = useEvents();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAutoGiftSetup, setShowAutoGiftSetup] = useState(false);

  const handleSubmit = async (data: EventFormData) => {
    setIsSubmitting(true);
    try {
      // Create the extended event data structure
      const extendedEventData = {
        id: "", // Will be set by the service
        type: data.eventType,
        person: data.personName,
        date: data.date!.toLocaleDateString(),
        daysAway: 0,
        autoGiftEnabled: data.autoGiftEnabled,
        autoGiftAmount: data.giftBudget,
        privacyLevel: data.privacyLevel,
        isVerified: true,
        needsVerification: false,
        giftSource: "wishlist" as const,
        dateObj: data.date!,
        isRecurring: data.isRecurring,
        recurringType: data.recurringType,
      };

      // Get connection ID (excluding "none" option)
      const connectionId = data.personId && data.personId !== "none" ? data.personId : undefined;
      
      // Transform to database format with connection ID
      const dbEventData = {
        ...transformExtendedEventToDatabase(extendedEventData, connectionId),
        is_recurring: data.isRecurring,
        recurring_type: data.recurringType,
      };

      // Create the event
      const createdEvent = await eventsService.createEvent(dbEventData);

      // Create auto-gifting rule if enabled and connection is selected
      if (data.autoGiftEnabled && connectionId) {
        // Get the connected user's ID from the connection
        const { data: connection } = await supabase
          .from('user_connections')
          .select('connected_user_id')
          .eq('id', connectionId)
          .single();

        if (connection) {
          await unifiedGiftManagementService.createRule({
            user_id: (await supabase.auth.getUser()).data.user!.id,
            recipient_id: connection.connected_user_id,
            date_type: data.eventType,
            event_id: createdEvent.id,
            is_active: true,
            budget_limit: data.giftBudget,
            notification_preferences: {
              enabled: true,
              days_before: [7, 3, 1],
              email: true,
              push: false,
            },
            gift_selection_criteria: {
              source: "wishlist",
              categories: [],
              exclude_items: [],
            },
          });
        }
      }

      await refreshEvents();
      
      toast.success(`${data.eventType} for ${data.personName} has been added!`);
      
      // Show unified auto-gift setup if auto-gifting is enabled
      if (data.autoGiftEnabled) {
        setShowAutoGiftSetup(true);
      } else {
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Error creating event:", error);
      toast.error("Failed to create event. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const handleAutoGiftSetupComplete = () => {
    setShowAutoGiftSetup(false);
    onOpenChange(false);
    toast.success("🎁 Your event and auto-gifting are fully set up!");
  };

  return (
    <>
      <Dialog open={open && !showAutoGiftSetup} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Event</DialogTitle>
          </DialogHeader>
          
          <AddEventForm 
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        </DialogContent>
      </Dialog>

      {/* Auto-Gift Setup Flow */}
      <AutoGiftSetupFlow 
        open={showAutoGiftSetup}
        onOpenChange={handleAutoGiftSetupComplete}
      />
    </>
  );
};

export default AddEventDialog;
