
import React from "react";
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MonthDayPicker } from "@/components/ui/month-day-picker";
import { User } from "@supabase/supabase-js";

interface BasicInfoSectionProps {
  user: User | null;
}

const BasicInfoSection: React.FC<BasicInfoSectionProps> = ({ user }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Basic Information</h3>
      
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
  );
};

export default BasicInfoSection;
