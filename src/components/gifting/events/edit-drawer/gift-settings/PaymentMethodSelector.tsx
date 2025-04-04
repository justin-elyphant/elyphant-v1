
import React, { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { CreditCard, PlusCircle } from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectGroup, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface PaymentMethod {
  id: string;
  payment_method_id: string;
  last_four: string;
  card_type: string;
  is_default: boolean;
}

interface PaymentMethodSelectorProps {
  selectedPaymentMethodId?: string;
  onSelect: (paymentMethodId: string) => void;
}

const PaymentMethodSelector = ({ selectedPaymentMethodId, onSelect }: PaymentMethodSelectorProps) => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchPaymentMethods = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        
        const { data, error } = await supabase
          .from('payment_methods')
          .select('id, payment_method_id, last_four, card_type, is_default')
          .eq('user_id', user.id)
          .order('is_default', { ascending: false });
          
        if (error) {
          throw error;
        }
        
        setPaymentMethods(data || []);

        // If no payment method is selected but we have methods, select the default one
        if (!selectedPaymentMethodId && data && data.length > 0) {
          const defaultMethod = data.find(m => m.is_default) || data[0];
          onSelect(defaultMethod.id);
        }
      } catch (err) {
        console.error('Error fetching payment methods:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPaymentMethods();
  }, [user, selectedPaymentMethodId, onSelect]);
  
  const handleAddPaymentMethod = () => {
    // Save the current state and redirect to payment settings
    navigate('/settings?tab=payment');
  };
  
  if (isLoading) {
    return (
      <Card className="py-1 px-2 border border-primary/20">
        <div className="flex items-center justify-between gap-1">
          <div>
            <Label className="text-sm font-medium">Payment Method</Label>
            <p className="text-xs text-muted-foreground leading-tight">
              Loading payment methods...
            </p>
          </div>
        </div>
      </Card>
    );
  }
  
  return (
    <Card className="py-1 px-2 border border-primary/20">
      <div className="flex items-center justify-between gap-1">
        <div>
          <Label className="text-sm font-medium">Payment Method</Label>
          <p className="text-xs text-muted-foreground leading-tight">
            Select method for auto-gifting
          </p>
        </div>
        
        {paymentMethods.length === 0 ? (
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs"
            onClick={handleAddPaymentMethod}
          >
            <PlusCircle className="mr-1 h-3.5 w-3.5" />
            Add Method
          </Button>
        ) : (
          <div className="w-48">
            <Select
              value={selectedPaymentMethodId}
              onValueChange={onSelect}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Select a payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method.id} value={method.id}>
                      <div className="flex items-center">
                        <CreditCard className="mr-2 h-3.5 w-3.5" />
                        {method.card_type} •••• {method.last_four}
                        {method.is_default && (
                          <span className="ml-1 text-xs text-green-600">(Default)</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                  <SelectItem value="add-new">
                    <div className="flex items-center text-blue-500">
                      <PlusCircle className="mr-2 h-3.5 w-3.5" />
                      Add new payment method
                    </div>
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </Card>
  );
};

export default PaymentMethodSelector;
