import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ArrowRight, Calendar as CalendarIcon, Plus, Trash2, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { GiftSetupData } from "../GiftSetupWizard";
import { calculateHolidayDate, isKnownHoliday } from "@/constants/holidayDates";

interface WizardStepTwoProps {
  data: GiftSetupData;
  onNext: (stepData: Partial<GiftSetupData>) => void;
}

const EVENT_TYPES = [
  { value: "birthday", label: "Birthday" },
  { value: "anniversary", label: "Anniversary" },
  { value: "christmas", label: "Christmas" },
  { value: "valentine", label: "Valentine's Day" },
  { value: "mothers_day", label: "Mother's Day" },
  { value: "fathers_day", label: "Father's Day" },
  { value: "graduation", label: "Graduation" },
  { value: "promotion", label: "Work Promotion" },
  { value: "custom", label: "Custom Occasion" }
];

export const WizardStepTwo: React.FC<WizardStepTwoProps> = ({ data, onNext }) => {
  const [giftingEvents, setGiftingEvents] = useState(
    data.giftingEvents.length > 0 
      ? data.giftingEvents 
      : [{ dateType: "", date: "", isRecurring: true, customName: "" }]
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [autoPopulatedDates, setAutoPopulatedDates] = useState<Set<number>>(new Set());

  const addEvent = () => {
    setGiftingEvents(prev => [
      ...prev,
      { dateType: "", date: "", isRecurring: true, customName: "" }
    ]);
  };

  const removeEvent = (index: number) => {
    if (giftingEvents.length > 1) {
      setGiftingEvents(prev => prev.filter((_, i) => i !== index));
    }
  };

  const updateEvent = (index: number, field: string, value: any) => {
    setGiftingEvents(prev => prev.map((event, i) => {
      if (i === index) {
        const updatedEvent = { ...event, [field]: value };
        
        // Handle dateType changes
        if (field === "dateType") {
          if (isKnownHoliday(value)) {
            // Auto-populate date for known holidays
            const suggestedDate = calculateHolidayDate(value);
            if (suggestedDate) {
              updatedEvent.date = suggestedDate;
              setAutoPopulatedDates(prev => new Set(prev).add(index));
            }
          } else {
            // Clear date for non-holidays like birthday, anniversary, etc.
            updatedEvent.date = "";
            setAutoPopulatedDates(prev => {
              const newSet = new Set(prev);
              newSet.delete(index);
              return newSet;
            });
          }
        }
        
        // Clear auto-populated flag when user manually changes date
        if (field === "date") {
          setAutoPopulatedDates(prev => {
            const newSet = new Set(prev);
            newSet.delete(index);
            return newSet;
          });
        }
        
        return updatedEvent;
      }
      return event;
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    giftingEvents.forEach((event, index) => {
      if (!event.dateType) {
        newErrors[`dateType_${index}`] = "Please select an occasion type";
      }
      if (!event.date) {
        newErrors[`date_${index}`] = "Please select a date";
      }
      if (event.dateType === "custom" && !event.customName?.trim()) {
        newErrors[`customName_${index}`] = "Please enter a name for the custom occasion";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateForm()) {
      onNext({ giftingEvents });
    }
  };

  const formatDateForInput = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            When should we send gifts?
          </CardTitle>
          <CardDescription>
            Set up important dates and occasions when you'd like to send gifts to {data.recipientName}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {giftingEvents.map((event, index) => (
            <div key={index} className="p-4 border rounded-lg space-y-4 relative">
              {giftingEvents.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeEvent(index)}
                  className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Occasion Type *</Label>
                  <Select
                    value={event.dateType}
                    onValueChange={(value) => updateEvent(index, "dateType", value)}
                  >
                    <SelectTrigger className={errors[`dateType_${index}`] ? "border-destructive" : ""}>
                      <SelectValue placeholder="Select occasion" />
                    </SelectTrigger>
                    <SelectContent>
                      {EVENT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="min-h-[1.25rem]">
                    {errors[`dateType_${index}`] && (
                      <p className="text-sm text-destructive">{errors[`dateType_${index}`]}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 min-h-[1.25rem]">
                    <Label>Date *</Label>
                    {autoPopulatedDates.has(index) && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Sparkles className="h-3 w-3" />
                        Auto-filled
                      </div>
                    )}
                  </div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !event.date && "text-muted-foreground",
                          errors[`date_${index}`] && "border-destructive"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {event.date ? (
                          format(new Date(event.date), "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={event.date ? new Date(event.date) : undefined}
                        onSelect={(date) => {
                          if (date) {
                            updateEvent(index, "date", date.toISOString());
                          }
                        }}
                        initialFocus
                        className="p-3 pointer-events-auto"
                        captionLayout="dropdown"
                        fromYear={1900}
                        toYear={2100}
                        classNames={{
                          caption: "flex justify-center pt-1 relative items-center",
                          caption_label: "text-sm font-medium",
                          caption_dropdowns: "flex justify-center gap-1",
                          dropdown: "min-w-[80px]",
                          dropdown_month: "min-w-[120px]",
                          dropdown_year: "min-w-[80px]",
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                  <div className="min-h-[1.25rem]">
                    {errors[`date_${index}`] && (
                      <p className="text-sm text-destructive">{errors[`date_${index}`]}</p>
                    )}
                  </div>
                </div>
              </div>

              {event.dateType === "custom" && (
                <div className="space-y-2">
                  <Label>Custom Occasion Name *</Label>
                  <Input
                    placeholder="e.g., First Date Anniversary"
                    value={event.customName || ""}
                    onChange={(e) => updateEvent(index, "customName", e.target.value)}
                    className={errors[`customName_${index}`] ? "border-destructive" : ""}
                  />
                  {errors[`customName_${index}`] && (
                    <p className="text-sm text-destructive">{errors[`customName_${index}`]}</p>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Repeat annually</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically set up gifts for this occasion every year
                  </p>
                </div>
                <Switch
                  checked={event.isRecurring}
                  onCheckedChange={(checked) => updateEvent(index, "isRecurring", checked)}
                />
              </div>
            </div>
          ))}

          <Button
            variant="outline"
            onClick={addEvent}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Another Occasion
          </Button>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleNext} size="lg" className="min-w-32">
          Next: Preferences
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};