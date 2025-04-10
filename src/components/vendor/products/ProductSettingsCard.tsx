
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
            <label className="text-sm font-medium mb-1 block">Default Markup</label>
            <Select defaultValue="30">
              <SelectTrigger>
                <SelectValue placeholder="Select markup" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10%</SelectItem>
                <SelectItem value="20">20%</SelectItem>
                <SelectItem value="30">30%</SelectItem>
                <SelectItem value="40">40%</SelectItem>
                <SelectItem value="50">50%</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Applied to all products without a custom markup
            </p>
          </div>
          
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
