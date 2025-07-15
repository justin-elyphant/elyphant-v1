import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { User, Bell, Shield, Gift, Calendar, Users, Settings, ChevronRight } from "lucide-react";

// Import existing settings components
import GeneralSettings from "./GeneralSettings";
import NotificationSettings from "./NotificationSettings";
import PrivacySecuritySettings from "./PrivacySecuritySettings";

type SettingsTab = "profile" | "notifications" | "privacy" | "gifting";

interface UnifiedSettingsProps {
  initialTab?: SettingsTab;
}

const UnifiedSettings: React.FC<UnifiedSettingsProps> = ({ initialTab = "profile" }) => {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);

  const tabs = [
    { 
      id: "profile", 
      label: "My Profile", 
      icon: User,
      description: "Personal information and preferences",
      color: "text-blue-600"
    },
    { 
      id: "notifications", 
      label: "Notifications", 
      icon: Bell,
      description: "Manage your notification preferences",
      color: "text-green-600"
    },
    { 
      id: "privacy", 
      label: "Privacy & Security", 
      icon: Shield,
      description: "Control your privacy and security settings",
      color: "text-purple-600"
    },
    { 
      id: "gifting", 
      label: "Smart Gifting", 
      icon: Gift,
      description: "Auto-gifting and AI recommendations",
      color: "text-pink-600"
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "profile":
        return <GeneralSettings />;
      case "notifications":
        return <NotificationSettings />;
      case "privacy":
        return <PrivacySecuritySettings />;
      case "gifting":
        return <GiftingSettings />;
      default:
        return <GeneralSettings />;
    }
  };

  if (isMobile) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Settings</h1>
          <Badge variant="outline">Unified</Badge>
        </div>
        
        <Accordion type="single" collapsible className="w-full">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <AccordionItem key={tab.id} value={tab.id}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <Icon className={cn("h-5 w-5", tab.color)} />
                    <div className="text-left">
                      <p className="font-medium">{tab.label}</p>
                      <p className="text-sm text-muted-foreground">{tab.description}</p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="pt-4">
                    {tab.id === "profile" && <GeneralSettings />}
                    {tab.id === "notifications" && <NotificationSettings />}
                    {tab.id === "privacy" && <PrivacySecuritySettings />}
                    {tab.id === "gifting" && <GiftingSettings />}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Settings</h1>
        <Badge variant="outline">Unified</Badge>
      </div>
      
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as SettingsTab)}>
        <TabsList className="grid w-full grid-cols-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>
        
        <TabsContent value={activeTab} className="mt-6">
          {renderTabContent()}
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Simplified Gifting Settings Component
const GiftingSettings = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-pink-600" />
            Smart Gifting Features
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">Auto-Gift Reminders</h4>
                <p className="text-sm text-muted-foreground">
                  Get notified about upcoming events and gift opportunities
                </p>
              </div>
              <Button variant="outline" size="sm">
                Configure
              </Button>
            </div>
            
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">AI Recommendations</h4>
                <p className="text-sm text-muted-foreground">
                  Personalized gift suggestions based on your connections
                </p>
              </div>
              <Button variant="outline" size="sm">
                Optimize
              </Button>
            </div>
            
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">Special Dates</h4>
                <p className="text-sm text-muted-foreground">
                  Manage birthdays, anniversaries, and other important dates
                </p>
              </div>
              <Button variant="outline" size="sm">
                <Calendar className="h-4 w-4 mr-2" />
                Manage
              </Button>
            </div>
          </div>
          
          <div className="pt-4 border-t">
            <h4 className="font-medium mb-2">Quick Actions</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Button variant="ghost" className="justify-start">
                <Users className="h-4 w-4 mr-2" />
                Find Friends & Family
                <ChevronRight className="h-4 w-4 ml-auto" />
              </Button>
              <Button variant="ghost" className="justify-start">
                <Settings className="h-4 w-4 mr-2" />
                Advanced Settings
                <ChevronRight className="h-4 w-4 ml-auto" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UnifiedSettings;