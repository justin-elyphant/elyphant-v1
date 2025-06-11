
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Truck, Users, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import CheckoutForm from './CheckoutForm';
import ShippingOptionsForm from './ShippingOptionsForm';
import RecipientAssignmentSection from '@/components/cart/RecipientAssignmentSection';
import { ShippingInfo } from './useCheckoutState';
import { ShippingOption } from '@/components/marketplace/zinc/services/shippingQuoteService';
import { DeliveryScenario } from './useAdaptiveCheckout';

interface UnifiedDeliverySectionProps {
  scenario: DeliveryScenario;
  shippingInfo: ShippingInfo;
  onUpdateShippingInfo: (data: Partial<ShippingInfo>) => void;
  selectedShippingMethod: string;
  onShippingMethodChange: (method: string) => void;
  shippingOptions: ShippingOption[];
  isLoadingShipping: boolean;
}

const UnifiedDeliverySection: React.FC<UnifiedDeliverySectionProps> = ({
  scenario,
  shippingInfo,
  onUpdateShippingInfo,
  selectedShippingMethod,
  onShippingMethodChange,
  shippingOptions,
  isLoadingShipping,
}) => {
  const renderScenarioInfo = () => {
    switch (scenario) {
      case 'self':
        return (
          <Alert>
            <Truck className="h-4 w-4" />
            <AlertDescription>
              All items will be shipped to your address below.
            </AlertDescription>
          </Alert>
        );
      case 'gift':
        return (
          <Alert>
            <Users className="h-4 w-4" />
            <AlertDescription>
              Assign items to recipients. Each recipient's shipping address will be collected separately.
            </AlertDescription>
          </Alert>
        );
      case 'mixed':
        return (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Some items are for you (shipped to your address below) and others are gifts for recipients.
            </AlertDescription>
          </Alert>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {renderScenarioInfo()}
      
      {(scenario === 'self' || scenario === 'mixed') && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Your Shipping Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <CheckoutForm 
              shippingInfo={shippingInfo} 
              onUpdate={onUpdateShippingInfo} 
            />
            
            <Separator />
            
            <ShippingOptionsForm
              selectedMethod={selectedShippingMethod}
              onSelect={onShippingMethodChange}
              shippingOptions={shippingOptions}
              isLoading={isLoadingShipping}
            />
          </CardContent>
        </Card>
      )}
      
      {(scenario === 'gift' || scenario === 'mixed') && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Gift Recipients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RecipientAssignmentSection />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UnifiedDeliverySection;
