
import React, { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon, Users, Star } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const eventTypes = [
  { value: "birthday", label: "Birthday" },
  { value: "anniversary", label: "Anniversary" },
  { value: "holiday", label: "Holiday" },
  { value: "graduation", label: "Graduation" },
  { value: "wedding", label: "Wedding" },
  { value: "other", label: "Other" }
];

// Mock data for connected people
const connectedPeople = [
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

type EventFormValues = z.infer<typeof formSchema>;

interface AddEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AddEventDialog = ({ open, onOpenChange }: AddEventDialogProps) => {
  const [showContactPicker, setShowContactPicker] = useState(false);
  const [selectedContact, setSelectedContact] = useState<(typeof connectedPeople)[0] | null>(null);

  const form = useForm<EventFormValues>({
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
  const watchPrivacyLevel = form.watch("privacyLevel");
  const watchPersonName = form.watch("personName");

  // Select a contact from the network
  const selectContact = (contact: (typeof connectedPeople)[0]) => {
    setSelectedContact(contact);
    form.setValue("personName", contact.name);
    form.setValue("personId", contact.id);
    setShowContactPicker(false);
  };

  function onSubmit(data: EventFormValues) {
    console.log("Event data:", data);
    
    // Display different messages based on privacy level
    if (data.privacyLevel === "shared" || data.privacyLevel === "public") {
      toast.success(`Event added with ${data.privacyLevel} visibility`);
    } else {
      toast.success("Event added successfully");
    }
    
    onOpenChange(false);
    form.reset();
    setSelectedContact(null);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Event</DialogTitle>
          <DialogDescription>
            Add important dates to remember or set up auto-gifting.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="eventType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select event type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {eventTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="personName"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Person's Name</FormLabel>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 text-xs text-primary"
                      onClick={() => setShowContactPicker(!showContactPicker)}
                    >
                      <Users className="h-3.5 w-3.5 mr-1" />
                      Select from contacts
                    </Button>
                  </div>
                  
                  {showContactPicker ? (
                    <div className="relative">
                      <Command className="rounded-lg border shadow-md">
                        <CommandInput placeholder="Search people..." />
                        <CommandList>
                          <CommandEmpty>No people found.</CommandEmpty>
                          <CommandGroup heading="Connected People">
                            {connectedPeople.map((person) => (
                              <CommandItem
                                key={person.id}
                                onSelect={() => selectContact(person)}
                                className="flex items-center gap-2 py-2"
                              >
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={person.avatar} alt={person.name} />
                                  <AvatarFallback>{person.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col text-sm">
                                  <span className="font-medium">{person.name}</span>
                                  <span className="text-xs text-muted-foreground">{person.events} events</span>
                                </div>
                                {person.topGifter && (
                                  <Badge variant="outline" className="ml-auto flex items-center gap-1 bg-amber-50 text-amber-800 border-amber-200">
                                    <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                                    <span className="text-xs">Top Gifter</span>
                                  </Badge>
                                )}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </div>
                  ) : (
                    <>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            placeholder="Enter name" 
                            {...field} 
                            className={selectedContact ? "pr-8 border-primary/20" : ""}
                          />
                          {selectedContact && (
                            <div className="absolute right-2 top-1/2 -translate-y-1/2">
                              <Avatar className="h-5 w-5">
                                <AvatarImage src={selectedContact.avatar} alt={selectedContact.name} />
                                <AvatarFallback>{selectedContact.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                            </div>
                          )}
                        </div>
                      </FormControl>
                      {selectedContact?.topGifter && (
                        <div className="mt-1 flex items-center">
                          <Badge variant="outline" className="flex items-center gap-1 bg-amber-50 text-amber-800 border-amber-200">
                            <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                            <span className="text-xs">Top Gifter</span>
                          </Badge>
                        </div>
                      )}
                    </>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={`w-full pl-3 text-left font-normal ${
                            !field.value ? "text-muted-foreground" : ""
                          }`}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 z-50" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="privacyLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Privacy Level</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select privacy level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="private">
                        Private (Only you can see)
                      </SelectItem>
                      <SelectItem value="shared">
                        Shared (Only with connected users)
                      </SelectItem>
                      <SelectItem value="public">
                        Public (Visible to all)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Controls who can see this event. Shared events are verified with connected users.
                  </FormDescription>
                  {watchPrivacyLevel === "shared" && (
                    <FormDescription className="text-amber-600">
                      Only the event type and date will be shared. Person's name remains private.
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="autoGift"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Automated Gifting</FormLabel>
                    <FormDescription>
                      Automatically send a gift when this event occurs
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            {watchAutoGift && (
              <FormField
                control={form.control}
                name="autoGiftAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gift Budget</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                          <span className="text-gray-500">$</span>
                        </div>
                        <Input 
                          type="number" 
                          placeholder="0.00" 
                          className="pl-7" 
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <DialogFooter>
              <Button type="submit">Add Event</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddEventDialog;
