
import React, { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { ExtendedEventData, DeleteOptions, PrivacyLevel, RecurringType } from "../types";
import EventFormSection from "./EventFormSection";
import RecurringSection from "./RecurringSection";
import PrivacySection from "./PrivacySection";
import AutoGiftSection from "./AutoGiftSection";
import NotificationPreferencesSection from "./NotificationPreferencesSection";
import SeriesEditOptions from "./SeriesEditOptions";
import DeleteConfirmationDialog from "./DeleteConfirmationDialog";
import { eventsService } from "@/services/eventsService";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

interface EventEditDrawerProps {
  event: ExtendedEventData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (eventId: string, updates: any) => void;
  onDelete?: (eventId: string, options: DeleteOptions) => void;
}

const EventEditDrawer = ({ event, open, onOpenChange, onSave, onDelete }: EventEditDrawerProps) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    defaultValues: {
      type: "",
      person: "",
      date: new Date(),
      privacyLevel: "private" as PrivacyLevel,
      autoGiftEnabled: false,
      autoGiftAmount: 0,
      isRecurring: false,
      recurringType: "yearly" as RecurringType,
      endDate: null as Date | null,
      maxOccurrences: null as number | null,
      editType: "this_only" as 'this_only' | 'this_and_future' | 'entire_series',
    },
  });

  // Update form values when event changes
  useEffect(() => {
    if (event) {
      const [eventType, personName] = event.type && event.person 
        ? [event.type, event.person]
        : event.type?.includes(' - ') 
          ? event.type.split(' - ')
          : [event.type || '', event.person || ''];

      form.reset({
        type: eventType,
        person: personName,
        date: event.dateObj || new Date(),
        privacyLevel: event.privacyLevel,
        autoGiftEnabled: event.autoGiftEnabled,
        autoGiftAmount: event.autoGiftAmount || 0,
        isRecurring: event.isRecurring || false,
        recurringType: event.recurringType || "yearly",
        endDate: event.endDate ? new Date(event.endDate) : null,
        maxOccurrences: event.maxOccurrences || null,
        editType: "this_only",
      });
    }
  }, [event, form]);

  const handleSave = async (data: any) => {
    if (!event) return;

    setIsSubmitting(true);
    try {
      const updates = {
        date_type: `${data.type} - ${data.person}`,
        date: data.date.toISOString().split('T')[0],
        visibility: data.privacyLevel,
        is_recurring: data.isRecurring,
        recurring_type: data.recurringType,
        end_date: data.endDate?.toISOString().split('T')[0] || null,
        max_occurrences: data.maxOccurrences,
      };

      if (event.isRecurring && event.seriesId && data.editType !== 'this_only') {
        // Handle series updates
        const applyToFutureOnly = data.editType === 'this_and_future';
        await eventsService.updateSeries({
          series_id: event.seriesId,
          updates,
          apply_to_future_only: applyToFutureOnly
        });
        toast.success(`Series updated successfully`);
      } else {
        // Handle single event update
        await onSave(event.id, updates);
      }

      onOpenChange(false);
    } catch (error) {
      console.error('Error saving event:', error);
      toast.error('Failed to save event');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (options: DeleteOptions) => {
    if (!event || !onDelete) return;

    try {
      await onDelete(event.id, options);
      onOpenChange(false);
      toast.success('Event deleted successfully');
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Failed to delete event');
    }
  };

  if (!event) return null;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-[600px] sm:max-w-[600px] overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle>Edit Event</SheetTitle>
          </SheetHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSave)} className="space-y-6">
              <EventFormSection form={form} />
              
              {event.isRecurring && (
                <SeriesEditOptions form={form} event={event} />
              )}
              
              <RecurringSection form={form} />
              <PrivacySection form={form} />
              <AutoGiftSection form={form} />
              <NotificationPreferencesSection form={form} />

              <div className="flex justify-between pt-6">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setIsDeleteDialogOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
                
                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </SheetContent>
      </Sheet>

      <DeleteConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        event={event}
        onConfirm={handleDelete}
      />
    </>
  );
};

export default EventEditDrawer;
