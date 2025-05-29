
import React from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tag, User, Calendar as CalendarIcon } from "lucide-react";
import { UseFormReturn } from "react-hook-form";

interface EventFormSectionProps {
  form: UseFormReturn<any>;
}

const EventFormSection = ({ form }: EventFormSectionProps) => {
  const isRecurring = form.watch("isRecurring");

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

      {isRecurring && (
        <>
          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  End Date (Optional)
                </FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    {...field}
                    value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                    onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="maxOccurrences"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Max Occurrences (Optional)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Leave empty for unlimited"
                    min="1"
                    {...field}
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </>
      )}
    </div>
  );
};

export default EventFormSection;
