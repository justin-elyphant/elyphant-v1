
import React from "react";
import { Link } from "react-router-dom";
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
