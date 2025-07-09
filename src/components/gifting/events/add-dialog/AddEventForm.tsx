
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth";
import { useEnhancedConnections } from "@/hooks/profile/useEnhancedConnections";
import EventTypeSelector from "./EventTypeSelector";
import DateSelector from "./DateSelector";
import PersonSelector from "./PersonSelector";
import RecurringToggle from "./RecurringToggle";
import PrivacySelector from "./PrivacySelector";
import AutoGiftToggle from "./AutoGiftToggle";
import GiftBudgetInput from "./GiftBudgetInput";
import { EventFormData } from "./types";

const eventSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  date: z.date().nullable(),
  dateType: z.string().optional(),
  personId: z.string().optional(),
  eventType: z.string().min(1, "Event type is required"),
  personName: z.string().min(1, "Person name is required"),
  isRecurring: z.boolean().default(false),
  recurringType: z.enum(["yearly", "monthly", "custom"]).optional(),
  maxOccurrences: z.number().optional(),
  endDate: z.string().optional(),
  visibility: z.enum(["public", "friends", "private"]).default("friends").optional(),
  privacyLevel: z.enum(["public", "private", "shared"]).default("private"),
  autoGift: z.boolean().default(false).optional(),
  autoGiftEnabled: z.boolean().default(false),
  giftBudget: z.number().min(1).default(50),
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
      date: null,
      dateType: "birthday",
      personId: "",
      eventType: "birthday",
      personName: "",
      isRecurring: false,
      recurringType: "yearly",
      maxOccurrences: undefined,
      endDate: "",
      visibility: "friends",
      privacyLevel: "private",
      autoGift: false,
      autoGiftEnabled: false,
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
          <Label htmlFor="title">Event Title (Optional)</Label>
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
          value={form.watch("eventType")}
          onChange={(value) => form.setValue("eventType", value)}
        />

        <div>
          <Label htmlFor="personName">Person Name</Label>
          <Input
            id="personName"
            {...form.register("personName")}
            placeholder="Enter person's name"
          />
          {form.formState.errors.personName && (
            <p className="text-sm text-red-500 mt-1">
              {form.formState.errors.personName.message}
            </p>
          )}
        </div>

        <DateSelector
          value={form.watch("date")}
          onChange={(value) => form.setValue("date", value)}
        />

        <PersonSelector
          connections={connections}
          value={form.watch("personId") || "none"}
          onChange={(value) => form.setValue("personId", value === "none" ? "" : value)}
        />

        <RecurringToggle
          isRecurring={form.watch("isRecurring")}
          recurringType={form.watch("recurringType") as "yearly" | "monthly" | "custom" | undefined}
          maxOccurrences={form.watch("maxOccurrences")}
          endDate={form.watch("endDate")}
          onRecurringChange={(value) => form.setValue("isRecurring", value)}
          onRecurringTypeChange={(value) => form.setValue("recurringType", value as "yearly" | "monthly" | "custom")}
          onMaxOccurrencesChange={(value) => form.setValue("maxOccurrences", value)}
          onEndDateChange={(value) => form.setValue("endDate", value)}
        />

        <PrivacySelector
          value={form.watch("privacyLevel")}
          onChange={(value) => form.setValue("privacyLevel", value)}
        />

        <AutoGiftToggle
          autoGift={form.watch("autoGiftEnabled")}
          onAutoGiftChange={(value) => form.setValue("autoGiftEnabled", value)}
        />

        {form.watch("autoGiftEnabled") && (
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
