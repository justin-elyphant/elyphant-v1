
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form } from "@/components/ui/form";
import EventTypeSelector from "./EventTypeSelector";
import PersonSelector from "./PersonSelector";
import DateSelector from "./DateSelector";
import PrivacySelector from "./PrivacySelector";
import AutoGiftToggle from "./AutoGiftToggle";
import GiftBudgetInput from "./GiftBudgetInput";
import { AddEventFormValues, PersonContact, EventFormData } from "./types";

// Event types definition
const eventTypes = [
  { value: "birthday", label: "Birthday" },
  { value: "anniversary", label: "Anniversary" },
  { value: "holiday", label: "Holiday" },
  { value: "graduation", label: "Graduation" },
  { value: "wedding", label: "Wedding" },
  { value: "other", label: "Other" }
];

// Mock data for connected people
const connectedPeople: PersonContact[] = [
  { id: "1", name: "Alex Johnson", avatar: "/placeholder.svg", topGifter: true, events: 5 },
  { id: "2", name: "Jamie Smith", avatar: "/placeholder.svg", topGifter: true, events: 4 },
  { id: "3", name: "Taylor Wilson", avatar: "/placeholder.svg", topGifter: false, events: 3 },
  { id: "4", name: "Morgan Lee", avatar: "/placeholder.svg", topGifter: false, events: 2 },
  { id: "5", name: "Casey Brown", avatar: "/placeholder.svg", topGifter: false, events: 1 }
];

const formSchema = z.object({
  eventType: z.string({
    required_error: "Please select an event type",
  }),
  personName: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  personId: z.string().optional(),
  date: z.date({
    required_error: "Please select a date.",
  }),
  autoGift: z.boolean().default(false),
  autoGiftAmount: z.coerce.number().min(0).optional(),
  privacyLevel: z.enum(["private", "shared", "public"]).default("private"),
});

interface AddEventFormProps {
  formData: EventFormData;
  onFormDataChange: (data: EventFormData) => void;
  validationErrors?: Record<string, string>;
}

const AddEventForm = ({ formData, onFormDataChange, validationErrors = {} }: AddEventFormProps) => {
  const form = useForm<AddEventFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      eventType: formData.eventType,
      personName: formData.personName,
      personId: undefined,
      date: formData.date || undefined,
      autoGift: formData.autoGiftEnabled,
      autoGiftAmount: formData.giftBudget,
      privacyLevel: formData.privacyLevel,
    },
  });

  const watchAutoGift = form.watch("autoGift");

  // Update form data when form values change
  React.useEffect(() => {
    const subscription = form.watch((value) => {
      onFormDataChange({
        eventType: value.eventType || "",
        personName: value.personName || "",
        date: value.date || null,
        privacyLevel: value.privacyLevel || "private",
        autoGiftEnabled: value.autoGift || false,
        giftBudget: value.autoGiftAmount || 50,
      });
    });
    return () => subscription.unsubscribe();
  }, [form, onFormDataChange]);

  // Update form values when external formData changes
  React.useEffect(() => {
    form.setValue("eventType", formData.eventType);
    form.setValue("personName", formData.personName);
    form.setValue("date", formData.date || undefined);
    form.setValue("autoGift", formData.autoGiftEnabled);
    form.setValue("autoGiftAmount", formData.giftBudget);
    form.setValue("privacyLevel", formData.privacyLevel);
  }, [formData, form]);

  return (
    <Form {...form}>
      <div className="space-y-4">
        <EventTypeSelector form={form} eventTypes={eventTypes} validationError={validationErrors.eventType} />
        <PersonSelector form={form} connectedPeople={connectedPeople} validationError={validationErrors.personName} />
        <DateSelector form={form} validationError={validationErrors.date} />
        <PrivacySelector form={form} />
        <AutoGiftToggle form={form} />
        
        {watchAutoGift && (
          <GiftBudgetInput form={form} validationError={validationErrors.giftBudget} />
        )}
      </div>
    </Form>
  );
};

export default AddEventForm;
