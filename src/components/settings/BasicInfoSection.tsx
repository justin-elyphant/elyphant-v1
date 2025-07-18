
import React from "react";
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import ProfileImageUpload from "@/components/settings/ProfileImageUpload";
import { User } from "@supabase/supabase-js";
import { useFormContext } from "react-hook-form";
import { useProfile } from "@/contexts/profile/ProfileContext";

interface BasicInfoSectionProps {
  user: User | null;
}

const BasicInfoSection: React.FC<BasicInfoSectionProps> = ({ user }) => {
  const form = useFormContext();
  const { updateProfile } = useProfile();

  const handleImageUpdate = async (imageUrl: string | null) => {
    try {
      // Update the form value first to prevent race conditions
      form.setValue("profile_image", imageUrl);
      
      // Don't update the profile here - let the ProfileImageUpload component handle it
      // This prevents race conditions where the form reloads and overwrites the image
    } catch (error) {
      console.error("Failed to update profile image:", error);
    }
  };

  const currentImage = form.watch("profile_image");
  const currentName = form.watch("name") || "";

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">My Information</h3>
      
      {/* Profile Image Section */}
      <div className="flex flex-col items-center space-y-4 p-6 bg-muted/50 rounded-lg">
        <ProfileImageUpload
          currentImage={currentImage}
          name={currentName}
          onImageUpdate={handleImageUpdate}
          mandatory={true}
          showMandatoryIndicator={true}
        />
      </div>
      
      <div className="space-y-4">
        {/* First Name and Last Name Fields */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            name="first_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name *</FormLabel>
                <FormControl>
                  <Input placeholder="First name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            name="last_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Last name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Date of Birth Field with Full Calendar Picker */}
        <FormField
          name="date_of_birth"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Date of Birth *</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick your birth date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) =>
                      date > new Date() || date < new Date("1900-01-01")
                    }
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              <FormDescription>
                Used for age-appropriate gift recommendations and user matching.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input 
                  placeholder="you@example.com" 
                  {...field} 
                  disabled={!!user?.email} 
                />
              </FormControl>
              {user?.email && (
                <FormDescription>
                  Email address is connected to your account and cannot be changed here.
                </FormDescription>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input 
                  placeholder="your_username" 
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                This will be used for your public profile URL and connections.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        
        <FormField
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>About Me</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Tell us a bit about yourself" 
                  className="min-h-[100px]"
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                This will be visible on your profile page.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};

export default BasicInfoSection;
