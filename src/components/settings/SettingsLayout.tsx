
import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Tab {
  id: string;
  label: string;
}

interface SettingsLayoutProps {
  children: React.ReactNode;
  tabs?: Tab[];
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

const SettingsLayout: React.FC<SettingsLayoutProps> = ({ 
  children, 
  tabs, 
  activeTab, 
  onTabChange 
}) => {
  return (
    <div className="container max-w-5xl mx-auto py-8 px-4">
      <div className="mb-6">
        <Button variant="ghost" asChild className="p-0">
          <Link to="/dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
      
      {tabs && tabs.length > 0 && (
        <Tabs 
          value={activeTab} 
          onValueChange={onTabChange}
          className="mb-6"
        >
          <TabsList>
            {tabs.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}
      
      <div className="bg-white rounded-lg shadow-sm p-6">
        {children}
      </div>
    </div>
  );
};

export default SettingsLayout;
