import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { CreditCard } from "lucide-react";
import { Link } from "react-router-dom";
import { unifiedPaymentService } from "@/services/payment/UnifiedPaymentService";

interface PaymentMethod {
  id: string;
  last_four: string;
  card_type: string;
  exp_month: number;
  exp_year: number;
  is_default: boolean;
}

const PaymentMethodWidget = () => {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPaymentMethod = async () => {
      try {
        const methods = await unifiedPaymentService.getPaymentMethods();
        const defaultMethod = methods.find(m => m.is_default) || methods[0];
        setPaymentMethod(defaultMethod || null);
      } catch (error) {
        console.error("Error fetching payment methods:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentMethod();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-2/3" />
            <div className="h-3 bg-muted rounded w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!paymentMethod) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-3 mb-4">
            <CreditCard className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <h3 className="text-sm font-medium mb-1">Payment Method</h3>
              <p className="text-sm text-muted-foreground">No payment method saved</p>
            </div>
          </div>
          <div className="pt-3 border-t border-border">
            <Link 
              to="/settings?tab=payment" 
              className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
            >
              Add payment method
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  const cardType = paymentMethod.card_type.toUpperCase();

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="mb-4">
          <h3 className="text-sm font-medium mb-3">Payment Method</h3>
          <div className="space-y-1">
            <p className="text-sm font-medium">{cardType} •••• {paymentMethod.last_four}</p>
            <p className="text-sm text-muted-foreground">
              Expiration: {String(paymentMethod.exp_month).padStart(2, '0')}/{String(paymentMethod.exp_year).slice(-2)}
            </p>
          </div>
        </div>
        <div className="pt-3 border-t border-border">
          <Link 
            to="/settings?tab=payment" 
            className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
          >
            Manage payment methods
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentMethodWidget;
