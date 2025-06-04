
import React, { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Calendar, Gift } from "lucide-react";
import { MonthDayPicker } from "@/components/ui/month-day-picker";
import { ProfileData } from "../hooks/types";

interface ImportantDatesStepProps {
  profileData: ProfileData;
  updateProfileData: (key: keyof ProfileData, value: any) => void;
}

const ImportantDatesStep: React.FC<ImportantDatesStepProps> = ({ 
  profileData, 
  updateProfileData 
}) => {
  const [newDate, setNewDate] = useState<{ month: number; day: number } | null>(null);
  const [newDescription, setNewDescription] = useState("");

  const currentDates = profileData.importantDates || [];

  // Auto-add birthday if it exists and isn't already in important dates
  useEffect(() => {
    console.log("ImportantDatesStep - checking birthday:", profileData.birthday);
    console.log("Current important dates:", currentDates);
    
    if (profileData.birthday && !currentDates.some(date => date.description === "My Birthday")) {
      console.log("Adding birthday to important dates:", profileData.birthday);
      
      // Use the birthday month and day directly - no need to subtract 1 since we're storing the actual month number
      const birthdayDate = {
        date: new Date(2000, profileData.birthday.month - 1, profileData.birthday.day), // Date months are 0-indexed
        description: "My Birthday"
      };
      
      console.log("Created birthday date object:", birthdayDate);
      updateProfileData('importantDates', [birthdayDate, ...currentDates]);
    }
  }, [profileData.birthday, currentDates, updateProfileData]);

  const addDate = () => {
    if (newDate && newDescription.trim()) {
      const dateToAdd = {
        date: new Date(2000, newDate.month - 1, newDate.day), // Use dummy year since we only care about month/day
        description: newDescription.trim()
      };
      updateProfileData('importantDates', [...currentDates, dateToAdd]);
      setNewDate(null);
      setNewDescription("");
    }
  };

  const removeDate = (index: number) => {
    const updatedDates = currentDates.filter((_, i) => i !== index);
    updateProfileData('importantDates', updatedDates);
  };

  const formatDateDisplay = (date: Date) => {
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    console.log("Formatting date for display:", date, "Month index:", date.getMonth(), "Day:", date.getDate());
    return `${months[date.getMonth()]} ${date.getDate()}`;
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-medium">Important Dates</h3>
        <p className="text-sm text-muted-foreground">
          Add special dates so friends know when to celebrate with you
        </p>
      </div>
      
      <div className="space-y-4">
        {/* Show existing dates */}
        {currentDates.length > 0 && (
          <div className="space-y-2">
            <Label>Your Important Dates</Label>
            <div className="space-y-2">
              {currentDates.map((dateItem, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    {dateItem.description === "My Birthday" ? (
                      <Gift className="h-4 w-4 text-purple-600" />
                    ) : (
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                    )}
                    <div>
                      <p className="font-medium">{dateItem.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDateDisplay(dateItem.date instanceof Date 
                          ? dateItem.date 
                          : new Date(dateItem.date)
                        )}
                      </p>
                    </div>
                  </div>
                  {dateItem.description !== "My Birthday" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDate(index)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add new date */}
        <div className="space-y-3">
          <Label>Add Another Important Date</Label>
          <div className="space-y-3">
            <div>
              <Label htmlFor="date-picker" className="text-sm">Date</Label>
              <MonthDayPicker
                value={newDate}
                onChange={setNewDate}
                placeholder="Select date"
              />
            </div>
            <div>
              <Label htmlFor="description" className="text-sm">Description</Label>
              <Input
                id="description"
                placeholder="e.g., Wedding Anniversary, Mom's Birthday, Christmas"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
              />
            </div>
            <Button
              type="button"
              onClick={addDate}
              disabled={!newDate || !newDescription.trim()}
              className="w-full"
              variant="outline"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Date
            </Button>
          </div>
        </div>

        {/* Skip option */}
        <div className="text-center pt-4 border-t">
          <p className="text-sm text-muted-foreground mb-2">
            Don't worry, you can always add more dates later in your settings
          </p>
        </div>
      </div>
    </div>
  );
};

export default ImportantDatesStep;
