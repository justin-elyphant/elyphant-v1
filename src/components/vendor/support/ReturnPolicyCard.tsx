
import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ReturnPolicyCardProps {
  onSave: () => void;
}

const ReturnPolicyCard: React.FC<ReturnPolicyCardProps> = ({ onSave }) => {
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Return Policy Settings</CardTitle>
        <CardDescription>
          Customize your return policies and handling procedures
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="return-window">Return Window</Label>
              <Select defaultValue="30">
                <SelectTrigger id="return-window">
                  <SelectValue placeholder="Select return window" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="14">14 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="60">60 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Time period during which customers can initiate returns
              </p>
            </div>
            
            <div>
              <Label htmlFor="return-condition">Return Condition Requirements</Label>
              <Select defaultValue="unused">
                <SelectTrigger id="return-condition">
                  <SelectValue placeholder="Select condition requirements" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any condition</SelectItem>
                  <SelectItem value="good">Good condition</SelectItem>
                  <SelectItem value="unused">Unused with tags/packaging</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Required condition of items being returned
              </p>
            </div>
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Automatically Approve Returns</Label>
              <Switch checked={false} />
            </div>
            <p className="text-xs text-muted-foreground">
              When enabled, returns meeting your policy requirements will be automatically approved
            </p>
          </div>
          
          <Button onClick={onSave}>
            Save Return Policy Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// A simple Switch component 
const Switch = ({ checked }: { checked: boolean }) => {
  return (
    <div className={`relative inline-block w-10 h-5 rounded-full ${checked ? 'bg-primary' : 'bg-gray-300'}`}>
      <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${checked ? 'translate-x-5' : ''}`}></div>
    </div>
  );
};

export default ReturnPolicyCard;
