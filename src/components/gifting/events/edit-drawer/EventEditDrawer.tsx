
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { ExtendedEventData } from "../types";
import EventFormSection from "./EventFormSection";
import PrivacySection from "./PrivacySection";
import AutoGiftSection from "./AutoGiftSection";
import RecurringSection from "./RecurringSection";
import NotificationPreferencesSection from "./NotificationPreferencesSection";

const editEventSchema = z.object({
  person: z.string().min(1, "Person name is required"),
  type: z.string().min(1, "Event type is required"),
  date: z.date(),
  privacyLevel: z.enum(["private", "shared", "public"]),
  autoGiftEnabled: z.boolean(),
  autoGiftAmount: z.number().min(0).optional(),
  isRecurring: z.boolean(),
  recurringType: z.enum(["yearly", "monthly", "custom"]).optional(),
});

type EditEventFormData = z.infer<typeof editEventSchema>;

interface EventEditDrawerProps {
  event: ExtendedEventData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (eventId: string, updates: any) => Promise<void>;
}

const EventEditDrawer = ({ event, open, onOpenChange, onSave }: EventEditDrawerProps) => {
  const form = useForm<EditEventFormData>({
    resolver: zodResolver(editEventSchema),
    defaultValues: {
      person: "",
      type: "",
      date: new Date(),
      privacyLevel: "private",
      autoGiftEnabled: false,
      autoGiftAmount: 50,
      isRecurring: false,
      recurringType: "yearly",
    },
  });

  // Update form when event changes
  React.useEffect(() => {
    if (event) {
      form.reset({
        person: event.person,
        type: event.type,
        date: event.dateObj || new Date(),
        privacyLevel: event.privacyLevel,
        autoGiftEnabled: event.autoGiftEnabled,
        autoGiftAmount: event.autoGiftAmount,
        isRecurring: false, // Will be updated based on actual data
        recurringType: "yearly",
      });
    }
  }, [event, form]);

  const handleSave = async (data: EditEventFormData) => {
    if (!event) return;

    try {
      await onSave(event.id, {
        date_type: `${data.type} - ${data.person}`,
        date: data.date.toISOString().split('T')[0],
        visibility: data.privacyLevel,
        is_recurring: data.isRecurring,
        recurring_type: data.recurringType,
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving event:", error);
    }
  };

  if (!event) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle>Edit Event</SheetTitle>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSave)} className="space-y-6">
            <EventFormSection form={form} />
            
            <Separator />
            
            <PrivacySection form={form} />
            
            <Separator />
            
            <RecurringSection form={form} />
            
            <Separator />
            
            <AutoGiftSection form={form} />
            
            <Separator />
            
            <NotificationPreferencesSection form={form} />

            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1">
                Save Changes
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
};

export default EventEditDrawer;
