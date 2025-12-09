import React from "react";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SettingsCardNavigation from "./SettingsCardNavigation";
import { triggerHapticFeedback } from "@/utils/haptics";
import { motion, AnimatePresence } from "framer-motion";

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
    triggerHapticFeedback('light');
    onTabChange("");
    window.scrollTo(0, 0);
  };

  const handleTabChange = (tab: string) => {
    triggerHapticFeedback('selection');
    onTabChange(tab);
    window.scrollTo(0, 0);
  };

  const getActiveTabLabel = () => {
    const tab = tabs.find(t => t.id === activeTab);
    return tab?.label || "Settings";
  };

  return (
    <div className="container max-w-5xl mx-auto py-6 md:py-8 px-4">
      {showCardNavigation ? (
        // Card-based navigation for mobile/tablet (and desktop)
        <SettingsCardNavigation onSelectSection={handleTabChange} />
      ) : (
        // Section content view with back button
        <div className="space-y-6">
          {/* Back button and section title */}
          <div className="flex items-center gap-3">
            <motion.div whileTap={{ scale: 0.95 }} transition={{ type: "spring", stiffness: 400, damping: 25 }}>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBackToNavigation}
                className="h-11 w-11 -ml-2 min-h-[44px] min-w-[44px]"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </motion.div>
            <h1 className="text-xl font-semibold">{getActiveTabLabel()}</h1>
          </div>

          {/* Desktop horizontal tabs (hidden on mobile/tablet) */}
          <div className="hidden lg:block">
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              <TabsList className="mb-6 w-full max-w-lg min-h-[44px]">
                {tabs.map((tab) => (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className="flex-1 text-xs min-h-[40px]"
                  >
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {/* Content area */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-background rounded-lg"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default SettingsLayout;
