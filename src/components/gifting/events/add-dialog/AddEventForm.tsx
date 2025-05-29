
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
import RecurringToggle from "./RecurringToggle";
import { AddEventFormValues, PersonContact, EventFormData } from "./types";
import { useConnections } from "@/hooks/useConnections";

// Event types definition
const eventTypes = [
  { value: "birthday", label: "Birthday" },
  { value: "anniversary", label: "Anniversary" },
  { value: "holiday", label: "Holiday" },
  { value: "graduation", label: "Graduation" },
  { value: "wedding", label: "Wedding" },
  { value: "other", label: "Other" }
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
  isRecurring: z.boolean().default(false),
  recurringType: z.enum(["yearly", "monthly", "custom"]).optional(),
});

interface AddEventFormProps {
  formData: EventFormData;
  onFormDataChange: (data: EventFormData) => void;
  validationErrors?: Record<string, string>;
}

const AddEventForm = ({ formData, onFormDataChange, validationErrors = {} }: AddEventFormProps) => {
  const { friends, following } = useConnections();
  
  // Convert connections to PersonContact format
  const connectedPeople: PersonContact[] = React.useMemo(() => {
    const allConnections = [...friends, ...following];
    return allConnections.map(conn => ({
      id: conn.id,
      name: conn.name,
      avatar: conn.imageUrl,
      topGifter: Math.random() > 0.7, // Random for now, could be based on actual data
      events: Math.floor(Math.random() * 10) + 1 // Random for now
    }));
  }, [friends, following]);

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
      isRecurring: formData.isRecurring,
      recurringType: formData.recurringType,
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
        isRecurring: value.isRecurring || false,
        recurringType: value.recurringType,
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
    form.setValue("isRecurring", formData.isRecurring);
    form.setValue("recurringType", formData.recurringType);
  }, [formData, form]);

  return (
    <Form {...form}>
      <div className="space-y-4">
        <EventTypeSelector form={form} eventTypes={eventTypes} validationError={validationErrors.eventType} />
        <PersonSelector form={form} connectedPeople={connectedPeople} validationError={validationErrors.personName} />
        <DateSelector form={form} validationError={validationErrors.date} />
        <PrivacySelector form={form} />
        <RecurringToggle form={form} validationError={validationErrors.recurringType} />
        <AutoGiftToggle form={form} />
        
        {watchAutoGift && (
          <GiftBudgetInput form={form} validationError={validationErrors.giftBudget} />
        )}
      </div>
    </Form>
  );
};

export default AddEventForm;
