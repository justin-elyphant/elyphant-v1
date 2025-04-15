
import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SettingsTab {
  id: string;
  label: string;
}

interface SettingsLayoutProps {
  children: React.ReactNode;
  tabs: SettingsTab[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const SettingsLayout: React.FC<SettingsLayoutProps> = ({
  children,
  tabs,
  activeTab,
  onTabChange,
}) => {
  return (
    <div className="container max-w-5xl mx-auto py-8 px-4">
      <div className="flex items-center mb-6">
        <Button variant="ghost" asChild className="p-0">
          <Link to="/dashboard" className="flex items-center">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
      
      <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
        <TabsList className="mb-8 w-full max-w-md">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="flex-1"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          {children}
        </div>
      </Tabs>
    </div>
  );
};

export default SettingsLayout;
