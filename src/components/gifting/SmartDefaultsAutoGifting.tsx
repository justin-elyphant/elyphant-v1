import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Zap, Calendar, Gift, Users, Settings, ChevronRight, Check } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

const SmartDefaultsAutoGifting = () => {
  const isMobile = useIsMobile();
  const [autoGiftingEnabled, setAutoGiftingEnabled] = useState(false);
  const [defaultBudget, setDefaultBudget] = useState([50]);
  const [giftSource, setGiftSource] = useState("wishlist");
  const [reminderDays, setReminderDays] = useState("7");

  const smartDefaults = {
    budget: 50,
    source: "wishlist",
    timing: "7 days before",
    approval: "auto-approve under budget",
    categories: ["birthday", "anniversary", "holiday"],
    relationships: {
      family: 75,
      friends: 50,
      colleagues: 25
    }
  };

  return (
    <div className="space-y-6">
      {/* Main Toggle */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-purple-600" />
            Smart Auto-Gifting
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Never miss a special occasion. We'll handle the details automatically.
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="auto-gifting" className="text-base font-medium">
                Enable Auto-Gifting
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Automatically suggest and send gifts for special occasions
              </p>
            </div>
            <Switch
              id="auto-gifting"
              checked={autoGiftingEnabled}
              onCheckedChange={setAutoGiftingEnabled}
            />
          </div>
        </CardContent>
      </Card>

      {/* Smart Defaults Configuration */}
      {autoGiftingEnabled && (
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-blue-600" />
              Smart Defaults
              <Badge variant="secondary" className="ml-2">AI-Optimized</Badge>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              We've pre-configured optimal settings based on successful gift-giving patterns
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Budget Setting */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Default Budget</Label>
                <span className="text-sm text-muted-foreground">${defaultBudget[0]}</span>
              </div>
              <Slider
                value={defaultBudget}
                onValueChange={setDefaultBudget}
                max={200}
                min={10}
                step={10}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>$10</span>
                <span>$200</span>
              </div>
            </div>

            {/* Gift Source */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Gift Source Priority</Label>
              <Select value={giftSource} onValueChange={setGiftSource}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="wishlist">
                    <div className="flex items-center gap-2">
                      <Gift className="h-4 w-4" />
                      Wishlist Items First
                    </div>
                  </SelectItem>
                  <SelectItem value="ai">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      AI Recommendations
                    </div>
                  </SelectItem>
                  <SelectItem value="popular">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Popular Items
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Reminder Timing */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Reminder Timing</Label>
              <Select value={reminderDays} onValueChange={setReminderDays}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="14">14 days before</SelectItem>
                  <SelectItem value="7">7 days before (Recommended)</SelectItem>
                  <SelectItem value="3">3 days before</SelectItem>
                  <SelectItem value="1">1 day before</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Smart Features */}
            <div className="space-y-4">
              <Label className="text-sm font-medium">Smart Features</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-center gap-2 p-3 border rounded-lg bg-green-50 dark:bg-green-900/20">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Relationship-based budgets</span>
                </div>
                <div className="flex items-center gap-2 p-3 border rounded-lg bg-green-50 dark:bg-green-900/20">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Avoid duplicate gifts</span>
                </div>
                <div className="flex items-center gap-2 p-3 border rounded-lg bg-green-50 dark:bg-green-900/20">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Optimal timing delivery</span>
                </div>
                <div className="flex items-center gap-2 p-3 border rounded-lg bg-green-50 dark:bg-green-900/20">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Learning from feedback</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="pt-4 border-t">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Button variant="outline" className="justify-start">
                  <Calendar className="h-4 w-4 mr-2" />
                  Add Special Dates
                  <ChevronRight className="h-4 w-4 ml-auto" />
                </Button>
                <Button variant="outline" className="justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  Connect with Friends
                  <ChevronRight className="h-4 w-4 ml-auto" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Getting Started */}
      {!autoGiftingEnabled && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto">
                <Gift className="h-8 w-8 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Ready to Never Miss an Occasion?</h3>
                <p className="text-sm text-muted-foreground">
                  Enable auto-gifting and we'll handle the rest with smart defaults
                </p>
              </div>
              <Button 
                onClick={() => setAutoGiftingEnabled(true)}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                Get Started
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SmartDefaultsAutoGifting;