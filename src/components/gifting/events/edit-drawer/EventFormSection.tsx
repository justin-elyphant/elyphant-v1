
import React from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tag, User, Calendar as CalendarIcon } from "lucide-react";
import { UseFormReturn } from "react-hook-form";

interface EventFormSectionProps {
  form: UseFormReturn<any>;
}

const EventFormSection = ({ form }: EventFormSectionProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Event Details</h3>
      
      <FormField
        control={form.control}
        name="type"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center">
              <Tag className="h-4 w-4 mr-2" />
              Event Type
            </FormLabel>
            <FormControl>
              <Input
                placeholder="Birthday, Anniversary, etc."
                {...field}
              />
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
            <FormLabel className="flex items-center">
              <User className="h-4 w-4 mr-2" />
              Person
            </FormLabel>
            <FormControl>
              <Input
                placeholder="Name of the person"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="date"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center">
              <CalendarIcon className="h-4 w-4 mr-2" />
              Date
            </FormLabel>
            <FormControl>
              <Input
                type="date"
                {...field}
                value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                onChange={(e) => field.onChange(new Date(e.target.value))}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

export default EventFormSection;
