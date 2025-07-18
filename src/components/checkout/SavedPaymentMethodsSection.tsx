import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { CreditCard, Plus, Trash2, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth';
import { toast } from 'sonner';

interface PaymentMethod {
  id: string;
  stripe_payment_method_id: string;
  card_type: string;
  last_four: string;
  exp_month: number;
  exp_year: number;
  is_default: boolean;
}

interface SavedPaymentMethodsSectionProps {
  onSelectPaymentMethod: (method: PaymentMethod | null) => void;
  onAddNewMethod: () => void;
  selectedMethodId?: string | null;
}

const SavedPaymentMethodsSection = ({
  onSelectPaymentMethod,
  onAddNewMethod,
  selectedMethodId
}: SavedPaymentMethodsSectionProps) => {
  const { user } = useAuth();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchPaymentMethods();
    }
  }, [user]);

  const fetchPaymentMethods = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPaymentMethods(data || []);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      toast.error('Failed to load saved payment methods');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMethod = async (methodId: string) => {
    try {
      const { error } = await supabase
        .from('payment_methods')
        .delete()
        .eq('id', methodId);

      if (error) throw error;

      setPaymentMethods(prev => prev.filter(method => method.id !== methodId));
      toast.success('Payment method removed');
      
      // If this was the selected method, clear selection
      if (selectedMethodId === methodId) {
        onSelectPaymentMethod(null);
      }
    } catch (error) {
      console.error('Error deleting payment method:', error);
      toast.error('Failed to remove payment method');
    }
  };

  const getCardIcon = (cardType: string) => {
    switch (cardType.toLowerCase()) {
      case 'visa':
        return '💳';
      case 'mastercard':
        return '💳';
      case 'amex':
        return '💳';
      case 'discover':
        return '💳';
      default:
        return <CreditCard className="h-5 w-5" />;
    }
  };

  const formatCardType = (cardType: string) => {
    return cardType.charAt(0).toUpperCase() + cardType.slice(1);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (paymentMethods.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Payment Method</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-6 pt-0">
          <CreditCard className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-3">No saved payment methods</p>
          <Button onClick={onAddNewMethod} className="flex items-center gap-2 h-9">
            <Plus className="h-4 w-4" />
            Add Payment Method
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span>Choose Payment Method</span>
          <Badge variant="secondary" className="flex items-center gap-1 px-2 py-1">
            <Shield className="h-3 w-3" />
            Secure
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <RadioGroup 
          value={selectedMethodId || 'new'} 
          onValueChange={(value) => {
            if (value === 'new') {
              onSelectPaymentMethod(null);
            } else {
              const method = paymentMethods.find(m => m.id === value);
              onSelectPaymentMethod(method || null);
            }
          }}
        >
          {/* Saved Payment Methods */}
          {paymentMethods.map((method) => (
            <div key={method.id} className="border rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value={method.id} id={method.id} />
                <Label 
                  htmlFor={method.id} 
                  className="flex-1 cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    {typeof getCardIcon(method.card_type) === 'string' ? (
                      <span className="text-lg">{getCardIcon(method.card_type)}</span>
                    ) : (
                      getCardIcon(method.card_type)
                    )}
                    <div>
                      <div className="font-medium text-sm">
                        {formatCardType(method.card_type)} •••• {method.last_four}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Expires {method.exp_month.toString().padStart(2, '0')}/{method.exp_year}
                        {method.is_default && <span className="ml-2 text-primary">• Default</span>}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      handleDeleteMethod(method.id);
                    }}
                    className="text-muted-foreground hover:text-destructive h-8 w-8 p-0"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </Label>
              </div>
            </div>
          ))}

          {/* Add New Payment Method Option */}
          <div className="border border-dashed rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="new" id="new" />
              <Label 
                htmlFor="new" 
                className="flex-1 cursor-pointer flex items-center gap-2"
              >
                <div className="border border-dashed border-muted-foreground rounded p-1">
                  <Plus className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <div className="font-medium text-sm">Add new payment method</div>
                  <div className="text-xs text-muted-foreground">Credit or debit card</div>
                </div>
              </Label>
            </div>
          </div>
        </RadioGroup>
      </CardContent>
    </Card>
  );
};

export default SavedPaymentMethodsSection;