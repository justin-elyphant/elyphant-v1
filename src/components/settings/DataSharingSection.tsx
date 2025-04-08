
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, MapPin, Gift } from "lucide-react";
import { Label } from "@/components/ui/label";
import { FormField, FormItem, FormControl, FormMessage } from "@/components/ui/form";
import { useFormContext } from "react-hook-form";
import { SharingLevel } from "@/types/supabase";

const DataSharingSection = () => {
  const form = useFormContext();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Privacy Settings</CardTitle>
        <CardDescription>
          Control who can see your personal information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <FormField
          control={form.control}
          name="data_sharing_settings.dob"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between space-x-4">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-blue-500" />
                  <div>
                    <Label className="text-base">Birthday</Label>
                    <p className="text-sm text-muted-foreground">Who can see your birthday</p>
                  </div>
                </div>
                <div className="w-32">
                  <FormControl>
                    <Select 
                      value={field.value} 
                      onValueChange={(val) => field.onChange(val as SharingLevel)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Everyone</SelectItem>
                        <SelectItem value="friends">Friends Only</SelectItem>
                        <SelectItem value="private">Only Me</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </div>
              </div>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="data_sharing_settings.shipping_address"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between space-x-4">
                <div className="flex items-center space-x-3">
                  <MapPin className="h-5 w-5 text-red-500" />
                  <div>
                    <Label className="text-base">Shipping Address</Label>
                    <p className="text-sm text-muted-foreground">Who can see your address</p>
                  </div>
                </div>
                <div className="w-32">
                  <FormControl>
                    <Select 
                      value={field.value} 
                      onValueChange={(val) => field.onChange(val as SharingLevel)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Everyone</SelectItem>
                        <SelectItem value="friends">Friends Only</SelectItem>
                        <SelectItem value="private">Only Me</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </div>
              </div>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="data_sharing_settings.gift_preferences"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between space-x-4">
                <div className="flex items-center space-x-3">
                  <Gift className="h-5 w-5 text-purple-500" />
                  <div>
                    <Label className="text-base">Gift Preferences</Label>
                    <p className="text-sm text-muted-foreground">Who can see your gift preferences</p>
                  </div>
                </div>
                <div className="w-32">
                  <FormControl>
                    <Select 
                      value={field.value} 
                      onValueChange={(val) => field.onChange(val as SharingLevel)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Everyone</SelectItem>
                        <SelectItem value="friends">Friends Only</SelectItem>
                        <SelectItem value="private">Only Me</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </div>
              </div>
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
};

export default DataSharingSection;
