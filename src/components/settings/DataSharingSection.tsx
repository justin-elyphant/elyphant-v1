
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, MapPin, Gift } from "lucide-react";
import { Label } from "@/components/ui/label";

interface DataSharingSectionProps {
  settings: {
    dob: "public" | "friends" | "private";
    shipping_address: "public" | "friends" | "private";
    gift_preferences: "public" | "friends" | "private";
  };
  onChange: (setting: "dob" | "shipping_address" | "gift_preferences", value: "public" | "friends" | "private") => void;
}

const DataSharingSection: React.FC<DataSharingSectionProps> = ({ settings, onChange }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Privacy Settings</CardTitle>
        <CardDescription>
          Control who can see your personal information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between space-x-4">
          <div className="flex items-center space-x-3">
            <Calendar className="h-5 w-5 text-blue-500" />
            <div>
              <Label className="text-base">Birthday</Label>
              <p className="text-sm text-muted-foreground">Who can see your birthday</p>
            </div>
          </div>
          <div className="w-32">
            <Select 
              value={settings.dob} 
              onValueChange={(val) => onChange('dob', val as "public" | "friends" | "private")}
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
          </div>
        </div>
        
        <div className="flex items-center justify-between space-x-4">
          <div className="flex items-center space-x-3">
            <MapPin className="h-5 w-5 text-red-500" />
            <div>
              <Label className="text-base">Shipping Address</Label>
              <p className="text-sm text-muted-foreground">Who can see your address</p>
            </div>
          </div>
          <div className="w-32">
            <Select 
              value={settings.shipping_address} 
              onValueChange={(val) => onChange('shipping_address', val as "public" | "friends" | "private")}
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
          </div>
        </div>
        
        <div className="flex items-center justify-between space-x-4">
          <div className="flex items-center space-x-3">
            <Gift className="h-5 w-5 text-purple-500" />
            <div>
              <Label className="text-base">Gift Preferences</Label>
              <p className="text-sm text-muted-foreground">Who can see your gift preferences</p>
            </div>
          </div>
          <div className="w-32">
            <Select 
              value={settings.gift_preferences} 
              onValueChange={(val) => onChange('gift_preferences', val as "public" | "friends" | "private")}
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
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DataSharingSection;
