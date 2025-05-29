
import React from "react";
import { FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { UseFormReturn } from "react-hook-form";
import { Repeat, Calendar, Edit } from "lucide-react";
import { ExtendedEventData } from "../types";

interface SeriesEditOptionsProps {
  form: UseFormReturn<any>;
  event: ExtendedEventData;
}

const SeriesEditOptions = ({ form, event }: SeriesEditOptionsProps) => {
  if (!event.isRecurring || !event.seriesId) {
    return null;
  }

  return (
    <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
      <div className="flex items-center gap-2">
        <Repeat className="h-4 w-4 text-blue-600" />
        <h4 className="font-medium text-blue-900">Recurring Event Options</h4>
      </div>
      
      <FormField
        control={form.control}
        name="editType"
        render={({ field }) => (
          <FormItem className="space-y-3">
            <FormLabel>What would you like to edit?</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                defaultValue={field.value || "this_only"}
                className="flex flex-col space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="this_only" id="this_only" />
                  <Label htmlFor="this_only" className="flex items-center gap-2">
                    <Edit className="h-3 w-3" />
                    This event only
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="this_and_future" id="this_and_future" />
                  <Label htmlFor="this_and_future" className="flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    This and all future events
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="entire_series" id="entire_series" />
                  <Label htmlFor="entire_series" className="flex items-center gap-2">
                    <Repeat className="h-3 w-3" />
                    Entire recurring series
                  </Label>
                </div>
              </RadioGroup>
            </FormControl>
          </FormItem>
        )}
      />

      {event.isModified && (
        <div className="text-sm text-amber-600 bg-amber-50 p-2 rounded">
          <strong>Note:</strong> This event has been individually modified and differs from the series defaults.
        </div>
      )}
    </div>
  );
};

export default SeriesEditOptions;
