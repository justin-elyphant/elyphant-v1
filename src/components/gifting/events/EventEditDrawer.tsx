
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Edit, Calendar, Gift, DollarSign } from "lucide-react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ExtendedEventData } from "../UpcomingEvents";

const formSchema = z.object({
  type: z.string().min(1, { message: "Event type is required" }),
  person: z.string().min(1, { message: "Person name is required" }),
  date: z.string().min(1, { message: "Date is required" }),
  autoGiftEnabled: z.boolean(),
  autoGiftAmount: z.string().optional(),
  giftSource: z.enum(["wishlist", "ai", "both"]),
  privacyLevel: z.enum(["private", "shared", "public"]),
});

type FormValues = z.infer<typeof formSchema>;

interface EventEditDrawerProps {
  event: ExtendedEventData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (eventId: number, updatedEvent: Partial<ExtendedEventData>) => void;
}

const EventEditDrawer = ({ event, open, onOpenChange, onSave }: EventEditDrawerProps) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "",
      person: "",
      date: "",
      autoGiftEnabled: false,
      autoGiftAmount: "",
      giftSource: "wishlist",
      privacyLevel: "private",
    }
  });

  // Update form when event changes
  useEffect(() => {
    if (event) {
      form.reset({
        type: event.type,
        person: event.person,
        date: event.date,
        autoGiftEnabled: event.autoGiftEnabled,
        autoGiftAmount: event.autoGiftAmount ? event.autoGiftAmount.toString() : "",
        giftSource: event.giftSource || "wishlist", // Default to wishlist if not specified
        privacyLevel: event.privacyLevel || "private",
      });
    }
  }, [event, form]);

  const handleSubmit = (values: FormValues) => {
    if (!event) return;
    
    const updatedEvent: Partial<ExtendedEventData> = {
      type: values.type,
      person: values.person,
      date: values.date,
      autoGiftEnabled: values.autoGiftEnabled,
      autoGiftAmount: values.autoGiftAmount ? parseInt(values.autoGiftAmount) : undefined,
      giftSource: values.giftSource,
      privacyLevel: values.privacyLevel,
    };

    onSave(event.id, updatedEvent);
    toast.success("Event updated successfully");
    onOpenChange(false);
  };

  if (!event) return null;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <div className="mx-auto w-full max-w-md">
          <DrawerHeader>
            <DrawerTitle className="flex items-center">
              <Edit className="h-5 w-5 mr-2" /> Edit Event
            </DrawerTitle>
            <DrawerDescription>
              Update event details and auto-gifting preferences
            </DrawerDescription>
          </DrawerHeader>
          
          <div className="px-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Event Type</FormLabel>
                        <FormControl>
                          <Input placeholder="Birthday" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="person"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Person</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-blue-500" />
                          <Input {...field} />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Format: Month Day, Year (e.g., May 15, 2023)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator className="my-4" />
                
                <div className="bg-muted/30 p-4 rounded-md">
                  <h3 className="font-medium mb-2 flex items-center">
                    <Gift className="h-4 w-4 mr-2" /> Auto-Gifting Settings
                  </h3>
                  
                  <FormField
                    control={form.control}
                    name="autoGiftEnabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Enable Auto-Gifting</FormLabel>
                          <FormDescription>
                            Automatically send a gift before this event
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
                  
                  {form.watch("autoGiftEnabled") && (
                    <>
                      <FormField
                        control={form.control}
                        name="autoGiftAmount"
                        render={({ field }) => (
                          <FormItem className="mt-3">
                            <FormLabel>Gift Budget</FormLabel>
                            <FormControl>
                              <div className="flex items-center">
                                <DollarSign className="h-4 w-4 mr-1 text-green-500" />
                                <Input placeholder="50" type="number" {...field} />
                              </div>
                            </FormControl>
                            <FormDescription>
                              Maximum amount to spend on this gift
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="giftSource"
                        render={({ field }) => (
                          <FormItem className="mt-3">
                            <FormLabel>Gift Selection Method</FormLabel>
                            <FormDescription>
                              How should we choose gifts for this event?
                            </FormDescription>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="mt-2 flex flex-col space-y-1"
                              >
                                <FormItem className="flex items-center space-x-3 space-y-0">
                                  <FormControl>
                                    <RadioGroupItem value="wishlist" />
                                  </FormControl>
                                  <FormLabel className="font-normal">
                                    Wishlist Only <Badge variant="outline" className="ml-1">Recommended</Badge>
                                  </FormLabel>
                                </FormItem>
                                <FormItem className="flex items-center space-x-3 space-y-0">
                                  <FormControl>
                                    <RadioGroupItem value="both" />
                                  </FormControl>
                                  <FormLabel className="font-normal">
                                    Wishlist first, then AI suggestions
                                  </FormLabel>
                                </FormItem>
                                <FormItem className="flex items-center space-x-3 space-y-0">
                                  <FormControl>
                                    <RadioGroupItem value="ai" />
                                  </FormControl>
                                  <FormLabel className="font-normal">
                                    AI recommendations only
                                  </FormLabel>
                                </FormItem>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}
                </div>

                <Separator className="my-4" />
                
                <FormField
                  control={form.control}
                  name="privacyLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Privacy Settings</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="mt-2 flex flex-col space-y-1"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="private" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Private - Only visible to you
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="shared" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Shared - Visible to connected users
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="public" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Public - Visible to everyone
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DrawerFooter>
                  <Button type="submit">Save Changes</Button>
                  <DrawerClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DrawerClose>
                </DrawerFooter>
              </form>
            </Form>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default EventEditDrawer;
