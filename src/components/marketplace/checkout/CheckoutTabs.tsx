
import React from "react";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Truck, Calendar, CreditCard, Users, Package } from "lucide-react";

interface CheckoutTabsProps {
  activeTab: string;
  onTabChange: (value: string) => void;
  availableTabs: string[];
  canProceedToNext: (tab: string) => boolean;
  children: React.ReactNode;
}

const CheckoutTabs = ({ 
  activeTab, 
  onTabChange, 
  availableTabs,
  canProceedToNext,
  children 
}: CheckoutTabsProps) => {
  const getTabIcon = (tab: string) => {
    switch (tab) {
      case 'shipping':
        return <Truck className="h-4 w-4" />;
      case 'recipients':
        return <Users className="h-4 w-4" />;
      case 'delivery':
        return <Package className="h-4 w-4" />;
      case 'schedule':
        return <Calendar className="h-4 w-4" />;
      case 'payment':
        return <CreditCard className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getTabLabel = (tab: string) => {
    switch (tab) {
      case 'shipping':
        return 'Shipping';
      case 'recipients':
        return 'Recipients';
      case 'delivery':
        return 'Delivery';
      case 'schedule':
        return 'Schedule';
      case 'payment':
        return 'Payment';
      default:
        return tab;
    }
  };

  const getTabIndex = (tab: string) => availableTabs.indexOf(tab);
  const currentTabIndex = getTabIndex(activeTab);

  return (
    <Tabs value={activeTab} onValueChange={onTabChange}>
      <TabsList className={`grid w-full grid-cols-${availableTabs.length} mb-6`}>
        {availableTabs.map((tab, index) => {
          const isDisabled = index > currentTabIndex + 1 || 
            (index > 0 && !canProceedToNext(availableTabs[index - 1]));
          
          return (
            <TabsTrigger 
              key={tab}
              value={tab} 
              className="flex items-center gap-2" 
              disabled={isDisabled}
            >
              {getTabIcon(tab)}
              <span className="hidden sm:inline">{getTabLabel(tab)}</span>
            </TabsTrigger>
          );
        })}
      </TabsList>
      
      {children}
    </Tabs>
  );
};

export default CheckoutTabs;
