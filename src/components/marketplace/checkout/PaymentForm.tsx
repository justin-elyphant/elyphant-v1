import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { CreditCard, Smartphone } from 'lucide-react';

interface PaymentFormProps {
  paymentMethod: string;
  onMethodChange: (method: string) => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({
  paymentMethod,
  onMethodChange
}) => {
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
                <div className="text-sm text-muted-foreground">Pay with your credit or debit card</div>
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

      {paymentMethod === "card" && (
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">
              Credit card details will be collected securely during checkout.
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PaymentForm;