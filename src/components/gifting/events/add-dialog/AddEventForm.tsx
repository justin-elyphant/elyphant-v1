
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import EventTypeSelector from "./EventTypeSelector";
import PersonSelector from "./PersonSelector";
import DateSelector from "./DateSelector";
import PrivacySelector from "./PrivacySelector";
import AutoGiftToggle from "./AutoGiftToggle";
import GiftBudgetInput from "./GiftBudgetInput";
import { AddEventFormValues, PersonContact } from "./types";

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
  onClose: () => void;
}

const AddEventForm = ({ onClose }: AddEventFormProps) => {
  const form = useForm<AddEventFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      eventType: "",
      personName: "",
      personId: undefined,
      autoGift: false,
      privacyLevel: "private",
    },
  });

  const watchAutoGift = form.watch("autoGift");

  function onSubmit(data: AddEventFormValues) {
    console.log("Event data:", data);
    
    // Display different messages based on privacy level
    if (data.privacyLevel === "shared" || data.privacyLevel === "public") {
      toast.success(`Event added with ${data.privacyLevel} visibility`);
    } else {
      toast.success("Event added successfully");
    }
    
    onClose();
    form.reset();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <EventTypeSelector form={form} eventTypes={eventTypes} />
        <PersonSelector form={form} connectedPeople={connectedPeople} />
        <DateSelector form={form} />
        <PrivacySelector form={form} />
        <AutoGiftToggle form={form} />
        
        {watchAutoGift && (
          <GiftBudgetInput form={form} />
        )}
        
        <DialogFooter>
          <Button type="submit">Add Event</Button>
        </DialogFooter>
      </form>
    </Form>
  );
};

export default AddEventForm;
