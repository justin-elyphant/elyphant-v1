
import React from "react";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Truck, Gift, Calendar, CreditCard } from "lucide-react";

interface CheckoutTabsProps {
  activeTab: string;
  onTabChange: (value: string) => void;
  canProceedToPayment: boolean;
  children: React.ReactNode;
}

const CheckoutTabs = ({ 
  activeTab, 
  onTabChange, 
  canProceedToPayment,
  children 
}: CheckoutTabsProps) => {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange}>
      <TabsList className="grid w-full grid-cols-4 mb-6">
        <TabsTrigger value="shipping" className="flex items-center gap-2">
          <Truck className="h-4 w-4" />
          <span className="hidden sm:inline">Shipping</span>
        </TabsTrigger>
        <TabsTrigger value="gift" className="flex items-center gap-2" disabled={!canProceedToPayment}>
          <Gift className="h-4 w-4" />
          <span className="hidden sm:inline">Gift Options</span>
        </TabsTrigger>
        <TabsTrigger value="schedule" className="flex items-center gap-2" disabled={!canProceedToPayment}>
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
