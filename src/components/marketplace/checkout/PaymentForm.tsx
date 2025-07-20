
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { CreditCard, Smartphone } from 'lucide-react';
import { useAuth } from '@/contexts/auth';
import SavedPaymentMethodsSection from '@/components/checkout/SavedPaymentMethodsSection';

interface PaymentMethod {
  id: string;
  stripe_payment_method_id: string;
  card_type: string;
  last_four: string;
  exp_month: number;
  exp_year: number;
  is_default: boolean;
}

interface PaymentFormProps {
  paymentMethod: string;
  onMethodChange: (method: string) => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({
  paymentMethod,
  onMethodChange
}) => {
  const { user } = useAuth();
  const [selectedSavedMethod, setSelectedSavedMethod] = useState<PaymentMethod | null>(null);

  const handleSelectPaymentMethod = (method: PaymentMethod | null) => {
    setSelectedSavedMethod(method);
    // When a saved method is selected, we're using card payment
    if (method) {
      onMethodChange('card');
    }
  };

  const handleAddNewMethod = () => {
    setSelectedSavedMethod(null);
    onMethodChange('card');
  };

  return (
    <div className="space-y-6">
      <RadioGroup value={paymentMethod} onValueChange={onMethodChange}>
        <div className="space-y-4">
          <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-accent/50 transition-colors">
            <RadioGroupItem value="card" id="card" />
            <Label htmlFor="card" className="flex items-center gap-3 cursor-pointer flex-1">
              <CreditCard className="h-5 w-5" />
              <div>
                <div className="font-medium">Credit Card</div>
                <div className="text-sm text-muted-foreground">
                  {user ? "Use saved card or add new" : "Pay with your credit or debit card"}
                </div>
              </div>
            </Label>
          </div>

          <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-accent/50 transition-colors">
            <RadioGroupItem value="paypal" id="paypal" />
            <Label htmlFor="paypal" className="flex items-center gap-3 cursor-pointer flex-1">
              <Smartphone className="h-5 w-5" />
              <div>
                <div className="font-medium">PayPal</div>
                <div className="text-sm text-muted-foreground">Pay with your PayPal account</div>
              </div>
            </Label>
          </div>
        </div>
      </RadioGroup>

      {paymentMethod === "card" && user && (
        <SavedPaymentMethodsSection
          onSelectPaymentMethod={handleSelectPaymentMethod}
          onAddNewMethod={handleAddNewMethod}
          selectedMethodId={selectedSavedMethod?.id}
        />
      )}

      {paymentMethod === "card" && !user && (
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">
              Credit card details will be collected securely during checkout.
            </div>
          </CardContent>
        </Card>
      )}

      {paymentMethod === "paypal" && (
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">
              You'll be redirected to PayPal to complete your payment.
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PaymentForm;
