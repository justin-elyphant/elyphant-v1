
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth";
import { useEnhancedConnections } from "@/hooks/profile/useEnhancedConnections";
import { EventTypeSelector } from "./EventTypeSelector";
import { DateSelector } from "./DateSelector";
import { PersonSelector } from "./PersonSelector";
import { RecurringToggle } from "./RecurringToggle";
import { PrivacySelector } from "./PrivacySelector";
import { AutoGiftToggle } from "./AutoGiftToggle";
import { GiftBudgetInput } from "./GiftBudgetInput";
import { EventFormData } from "./types";

const eventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  dateType: z.string().min(1, "Event type is required"),
  personId: z.string().optional(),
  isRecurring: z.boolean().default(false),
  recurringType: z.string().optional(),
  maxOccurrences: z.number().optional(),
  endDate: z.string().optional(),
  visibility: z.enum(["public", "friends", "private"]).default("friends"),
  autoGift: z.boolean().default(false),
  giftBudget: z.number().optional(),
});

interface AddEventFormProps {
  onSubmit: (data: EventFormData) => void;
  onCancel: () => void;
}

export const AddEventForm: React.FC<AddEventFormProps> = ({ onSubmit, onCancel }) => {
  const { user } = useAuth();
  const { connections } = useEnhancedConnections();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: "",
      description: "",
      date: "",
      dateType: "birthday",
      personId: "",
      isRecurring: false,
      recurringType: "yearly",
      maxOccurrences: undefined,
      endDate: "",
      visibility: "friends",
      autoGift: false,
      giftBudget: 50,
    }
  });

  const handleSubmit = async (data: EventFormData) => {
    if (!user) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      form.reset();
    } catch (error) {
      console.error("Error creating event:", error);
      toast.error("Failed to create event");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="title">Event Title</Label>
          <Input
            id="title"
            {...form.register("title")}
            placeholder="e.g., Mom's Birthday"
          />
          {form.formState.errors.title && (
            <p className="text-sm text-red-500 mt-1">
              {form.formState.errors.title.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="description">Description (Optional)</Label>
          <Textarea
            id="description"
            {...form.register("description")}
            placeholder="Add any notes or details..."
            rows={2}
          />
        </div>

        <EventTypeSelector
          value={form.watch("dateType")}
          onChange={(value) => form.setValue("dateType", value)}
        />

        <DateSelector
          value={form.watch("date")}
          onChange={(value) => form.setValue("date", value)}
        />

        <PersonSelector
          connections={connections}
          value={form.watch("personId")}
          onChange={(value) => form.setValue("personId", value)}
        />

        <RecurringToggle
          isRecurring={form.watch("isRecurring")}
          recurringType={form.watch("recurringType")}
          maxOccurrences={form.watch("maxOccurrences")}
          endDate={form.watch("endDate")}
          onRecurringChange={(value) => form.setValue("isRecurring", value)}
          onRecurringTypeChange={(value) => form.setValue("recurringType", value)}
          onMaxOccurrencesChange={(value) => form.setValue("maxOccurrences", value)}
          onEndDateChange={(value) => form.setValue("endDate", value)}
        />

        <PrivacySelector
          value={form.watch("visibility")}
          onChange={(value) => form.setValue("visibility", value)}
        />

        <AutoGiftToggle
          autoGift={form.watch("autoGift")}
          onAutoGiftChange={(value) => form.setValue("autoGift", value)}
        />

        {form.watch("autoGift") && (
          <GiftBudgetInput
            value={form.watch("giftBudget")}
            onChange={(value) => form.setValue("giftBudget", value)}
          />
        )}
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Create Event"}
        </Button>
      </div>
    </form>
  );
};
