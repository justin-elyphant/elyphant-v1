
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { CreditCard, Plus, Trash2 } from 'lucide-react';
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
  selectedMethodId?: string;
  refreshKey?: number; // Add this to trigger refresh from parent
}

const SavedPaymentMethodsSection: React.FC<SavedPaymentMethodsSectionProps> = ({
  onSelectPaymentMethod,
  onAddNewMethod,
  selectedMethodId,
  refreshKey
}) => {
  const { user } = useAuth();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedValue, setSelectedValue] = useState<string>('');

  const fetchPaymentMethods = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false });

      if (error) throw error;
      setPaymentMethods(data || []);

      // Auto-select default payment method
      const defaultMethod = data?.find(method => method.is_default);
      if (defaultMethod && !selectedMethodId) {
        setSelectedValue(defaultMethod.id);
        onSelectPaymentMethod(defaultMethod);
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      toast.error('Failed to load payment methods');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentMethods();
  }, [user, refreshKey]); // Add refreshKey to dependencies

  useEffect(() => {
    if (selectedMethodId) {
      setSelectedValue(selectedMethodId);
    }
  }, [selectedMethodId]);

  const handleSelectionChange = (value: string) => {
    setSelectedValue(value);
    
    if (value === 'new-card') {
      onSelectPaymentMethod(null);
      onAddNewMethod();
    } else {
      const method = paymentMethods.find(m => m.id === value);
      onSelectPaymentMethod(method || null);
    }
  };

  const handleRemoveMethod = async (methodId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    try {
      const { error } = await supabase
        .from('payment_methods')
        .delete()
        .eq('id', methodId);

      if (error) throw error;
      
      toast.success('Payment method removed');
      fetchPaymentMethods();
      
      // If the removed method was selected, clear selection
      if (selectedValue === methodId) {
        setSelectedValue('');
        onSelectPaymentMethod(null);
      }
    } catch (error) {
      console.error('Error removing payment method:', error);
      toast.error('Failed to remove payment method');
    }
  };

  if (isLoading) {
    return (
      <div className="py-4 text-center text-muted-foreground">
        Loading payment methods...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <RadioGroup value={selectedValue} onValueChange={handleSelectionChange}>
        {paymentMethods.map((method) => (
          <div key={method.id} className="relative">
            <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-accent/50 transition-colors">
              <RadioGroupItem value={method.id} id={method.id} />
              <Label htmlFor={method.id} className="flex items-center gap-3 cursor-pointer flex-1">
                <CreditCard className="h-5 w-5" />
                <div className="flex-1">
                  <div className="font-medium flex items-center gap-2">
                    {method.card_type} ending in {method.last_four}
                    {method.is_default && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                        Default
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Expires {method.exp_month.toString().padStart(2, '0')}/{method.exp_year}
                  </div>
                </div>
              </Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => handleRemoveMethod(method.id, e)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}

        {/* Add new card option */}
        <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-accent/50 transition-colors border-dashed">
          <RadioGroupItem value="new-card" id="new-card" />
          <Label htmlFor="new-card" className="flex items-center gap-3 cursor-pointer flex-1">
            <Plus className="h-5 w-5" />
            <div>
              <div className="font-medium">Add new payment method</div>
              <div className="text-sm text-muted-foreground">
                Use a different card for this purchase
              </div>
            </div>
          </Label>
        </div>
      </RadioGroup>

      {paymentMethods.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center">
            <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No saved payment methods</p>
            <Button onClick={onAddNewMethod} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Payment Method
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SavedPaymentMethodsSection;
