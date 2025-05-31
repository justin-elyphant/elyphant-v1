
import React from "react";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Truck, Calendar, CreditCard } from "lucide-react";

interface CheckoutTabsProps {
  activeTab: string;
  onTabChange: (value: string) => void;
  canProceedToSchedule: boolean;
  canProceedToPayment: boolean;
  children: React.ReactNode;
}

const CheckoutTabs = ({ 
  activeTab, 
  onTabChange, 
  canProceedToSchedule,
  canProceedToPayment,
  children 
}: CheckoutTabsProps) => {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange}>
      <TabsList className="grid w-full grid-cols-3 mb-6">
        <TabsTrigger value="shipping" className="flex items-center gap-2">
          <Truck className="h-4 w-4" />
          <span className="hidden sm:inline">Shipping</span>
        </TabsTrigger>
        <TabsTrigger value="schedule" className="flex items-center gap-2" disabled={!canProceedToSchedule}>
          <Calendar className="h-4 w-4" />
          <span className="hidden sm:inline">Schedule</span>
        </TabsTrigger>
        <TabsTrigger value="payment" className="flex items-center gap-2" disabled={!canProceedToPayment}>
          <CreditCard className="h-4 w-4" />
          <span className="hidden sm:inline">Payment</span>
        </TabsTrigger>
      </TabsList>
      
      {children}
    </Tabs>
  );
};

export default CheckoutTabs;
