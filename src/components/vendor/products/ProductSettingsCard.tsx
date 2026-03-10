
import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";

export const ProductSettingsCard = () => {
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Settings</CardTitle>
        <CardDescription>Configure product options</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          
          <div>
            <label className="text-sm font-medium mb-1 block">Default Fulfillment</label>
            <Select defaultValue="physical">
              <SelectTrigger>
                <SelectValue placeholder="Select fulfillment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="physical">Physical Shipping</SelectItem>
                <SelectItem value="digital">Digital</SelectItem>
                <SelectItem value="pickup">In-Store Pickup</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button variant="outline" className="w-full" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Advanced Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
