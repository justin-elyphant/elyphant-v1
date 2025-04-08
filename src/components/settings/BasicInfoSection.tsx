
import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";

interface BasicInfoSectionProps {
  formData: {
    name: string;
    email: string;
    birthday?: Date;
  };
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleBirthdayChange: (date: Date | undefined) => void;
  user: any;
}

const BasicInfoSection: React.FC<BasicInfoSectionProps> = ({
  formData,
  handleChange,
  handleBirthdayChange,
  user
}) => {
  // Function to format the birthday for display, showing only month and day
  const formatBirthday = (date: Date | undefined) => {
    if (!date) return "";
    return format(date, "MMMM d"); // Only display month and day, no year
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Basic Information</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input 
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter your name"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input 
            id="email"
            name="email"
            type="email"
            value={formData.email || user?.email || ""}
            onChange={handleChange}
            disabled={!!user?.email}
            placeholder="email@example.com"
          />
          {user?.email && (
            <p className="text-xs text-muted-foreground">
              Email is managed by your account and cannot be changed here
            </p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="birthday">Birthday</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !formData.birthday && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.birthday ? formatBirthday(formData.birthday) : <span>Select your birthday</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={formData.birthday}
                onSelect={handleBirthdayChange}
                initialFocus
                disabled={(date) => date > new Date()}
                captionLayout="dropdown-buttons"
                fromYear={1900}
                toYear={new Date().getFullYear()}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
};

export default BasicInfoSection;
