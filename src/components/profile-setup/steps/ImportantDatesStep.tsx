
import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Calendar } from "lucide-react";
import { ProfileData } from "../hooks/types";

interface ImportantDatesStepProps {
  profileData: ProfileData;
  updateProfileData: (key: keyof ProfileData, value: any) => void;
}

const ImportantDatesStep: React.FC<ImportantDatesStepProps> = ({ 
  profileData, 
  updateProfileData 
}) => {
  const [newDate, setNewDate] = useState("");
  const [newDescription, setNewDescription] = useState("");

  const currentDates = profileData.important_dates || [];

  const addDate = () => {
    if (newDate.trim() && newDescription.trim()) {
      const updatedDates = [
        ...currentDates,
        {
          date: new Date(newDate),
          description: newDescription.trim()
        }
      ];
      updateProfileData('important_dates', updatedDates);
      setNewDate("");
      setNewDescription("");
    }
  };

  const removeDate = (index: number) => {
    const updatedDates = currentDates.filter((_, i) => i !== index);
    updateProfileData('important_dates', updatedDates);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-medium">Important Dates</h3>
        <p className="text-sm text-muted-foreground">
          Add important dates like anniversaries, birthdays, or special occasions
        </p>
      </div>
      
      <div className="space-y-4">
        {/* Add new date */}
        <div className="space-y-2">
          <Label>Add Important Date</Label>
          <div className="grid gap-2">
            <Input
              type="date"
              placeholder="Select date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
            />
            <Input
              placeholder="e.g., Wedding Anniversary, Mom's Birthday"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
            />
            <Button
              type="button"
              onClick={addDate}
              disabled={!newDate.trim() || !newDescription.trim()}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Date
            </Button>
          </div>
        </div>

        {/* Current dates */}
        {currentDates.length > 0 && (
          <div className="space-y-2">
            <Label>Your Important Dates</Label>
            <div className="space-y-2">
              {currentDates.map((dateItem, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{dateItem.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {dateItem.date instanceof Date 
                          ? dateItem.date.toLocaleDateString()
                          : new Date(dateItem.date).toLocaleDateString()
                        }
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeDate(index)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImportantDatesStep;
