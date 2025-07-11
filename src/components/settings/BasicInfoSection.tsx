
import React from "react";
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MonthDayPicker } from "@/components/ui/month-day-picker";
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
      // Update the form value
      form.setValue("profile_image", imageUrl);
      
      // Only update the profile if we actually have a new image URL
      // Don't update for null values (which happen during initialization)
      if (imageUrl !== null) {
        await updateProfile({ profile_image: imageUrl });
      }
    } catch (error) {
      console.error("Failed to update profile image:", error);
    }
  };

  const currentImage = form.watch("profile_image");
  const currentName = form.watch("name") || "";

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Basic Information</h3>
      
      {/* Profile Image Section */}
      <div className="flex flex-col items-center space-y-4 p-6 bg-muted/50 rounded-lg">
        <ProfileImageUpload
          currentImage={currentImage}
          name={currentName}
          onImageUpdate={handleImageUpdate}
        />
      </div>
      
      <div className="space-y-4">
        <FormField
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Your name" {...field} />
              </FormControl>
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
          name="birthday"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Birthday</FormLabel>
              <FormControl>
                <MonthDayPicker
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Select your birthday"
                />
              </FormControl>
              <FormDescription>
                Only month and day - used for birthday reminders and age-appropriate gift suggestions.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bio</FormLabel>
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
