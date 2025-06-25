
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCart } from "@/contexts/CartContext";
import { useAdaptiveCheckout } from "./useAdaptiveCheckout";
import ShippingOptionsForm from "./ShippingOptionsForm";
import PaymentSection from "./PaymentSection";
import GiftOptionsForm from "./GiftOptionsForm";
import UnifiedDeliverySection from "./UnifiedDeliverySection";
import GiftScheduleForm from "./GiftScheduleForm";

interface CheckoutTabsProps {
  expressMode?: boolean;
  expressType?: 'self' | 'gift' | null;
}

const CheckoutTabs: React.FC<CheckoutTabsProps> = ({ 
  expressMode = false, 
  expressType = null 
}) => {
  const { cartItems } = useCart();
  const { adaptiveFlow } = useAdaptiveCheckout();
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (expressMode) {
      return expressType === 'gift' ? 'gift-options' : 'shipping';
    }
    return adaptiveFlow.tabs[0];
  });

  // Determine tabs based on express mode
  const getTabsForMode = () => {
    if (expressMode) {
      if (expressType === 'gift') {
        return [
          { id: 'gift-options', label: 'Gift Options', icon: '🎁' },
          { id: 'payment', label: 'Payment', icon: '💳' }
        ];
      } else {
        return [
          { id: 'shipping', label: 'Shipping', icon: '📦' },
          { id: 'payment', label: 'Payment', icon: '💳' }
        ];
      }
    }
    
    // Standard checkout tabs based on adaptive flow
    return adaptiveFlow.tabs.map(tab => {
      switch (tab) {
        case 'shipping':
          return { id: 'shipping', label: 'Shipping', icon: '📦' };
        case 'recipients':
          return { id: 'recipients', label: 'Recipients', icon: '👥' };
        case 'schedule':
          return { id: 'schedule', label: 'Schedule', icon: '📅' };
        case 'delivery':
          return { id: 'delivery', label: 'Delivery', icon: '🚚' };
        case 'payment':
          return { id: 'payment', label: 'Payment', icon: '💳' };
        default:
          return { id: tab, label: tab, icon: '⚙️' };
      }
    });
  };

  const tabs = getTabsForMode();

  if (cartItems.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Your cart is empty</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">
          {expressMode 
            ? `Express ${expressType === 'gift' ? 'Gift' : 'Checkout'}`
            : 'Checkout'
          }
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-3">
            {tabs.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id} className="text-xs">
                <span className="mr-1">{tab.icon}</span>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {tabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.id} className="mt-6">
              {tab.id === 'shipping' && <ShippingOptionsForm />}
              {tab.id === 'recipients' && <UnifiedDeliverySection />}
              {tab.id === 'schedule' && <GiftScheduleForm />}
              {tab.id === 'delivery' && <UnifiedDeliverySection />}
              {tab.id === 'gift-options' && <GiftOptionsForm />}
              {tab.id === 'payment' && <PaymentSection />}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default CheckoutTabs;
