import React from "react";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SettingsCardNavigation from "./SettingsCardNavigation";

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
  // Check if we're showing a specific section or the card navigation
  const showCardNavigation = !activeTab || activeTab === "";

  const handleBackToNavigation = () => {
    onTabChange("");
  };

  const getActiveTabLabel = () => {
    const tab = tabs.find(t => t.id === activeTab);
    return tab?.label || "Settings";
  };

  return (
    <div className="container max-w-5xl mx-auto py-6 md:py-8 px-4">
      {showCardNavigation ? (
        // Card-based navigation for mobile/tablet (and desktop)
        <SettingsCardNavigation onSelectSection={onTabChange} />
      ) : (
        // Section content view with back button
        <div className="space-y-6">
          {/* Back button and section title */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBackToNavigation}
              className="h-10 w-10 -ml-2"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold">{getActiveTabLabel()}</h1>
          </div>

          {/* Desktop horizontal tabs (hidden on mobile/tablet) */}
          <div className="hidden lg:block">
            <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
              <TabsList className="mb-6 w-full max-w-lg">
                {tabs.map((tab) => (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className="flex-1 text-xs"
                  >
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {/* Content area */}
          <div className="bg-background rounded-lg">
            {children}
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsLayout;
