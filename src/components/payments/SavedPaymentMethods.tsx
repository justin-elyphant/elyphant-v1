
import React, { useState, useEffect } from 'react';
import { useAuth } from "@/contexts/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface PaymentMethod {
  id: string;
  user_id: string;
  payment_method_id: string;
  stripe_payment_method_id: string;
  last_four: string;
  card_type: string;
  exp_month: number;
  exp_year: number;
  created_at: string;
  is_default: boolean;
}

const SavedPaymentMethods = () => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  
  const fetchPaymentMethods = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false });
        
      if (error) {
        throw error;
      }
      
      // Map database fields to component interface
      const mappedData = (data || []).map(method => ({
        ...method,
        payment_method_id: method.stripe_payment_method_id
      }));
      setPaymentMethods(mappedData);
    } catch (err) {
      console.error('Error fetching payment methods:', err);
      toast.error('Failed to load payment methods');
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchPaymentMethods();
  }, [user]);
  
  const handleSetDefault = async (id: string) => {
    if (!user) return;
    
    try {
      // First, set all methods to not default
      await supabase
        .from('payment_methods')
        .update({ is_default: false })
        .eq('user_id', user.id);
        
      // Then set the selected method as default
      const { error } = await supabase
        .from('payment_methods')
        .update({ is_default: true })
        .eq('id', id);
        
      if (error) {
        throw error;
      }
      
      toast.success('Default payment method updated');
      fetchPaymentMethods();
    } catch (err) {
      console.error('Error updating default payment method:', err);
      toast.error('Failed to update default payment method');
    }
  };
  
  const handleRemove = async (id: string) => {
    try {
      const { error } = await supabase
        .from('payment_methods')
        .delete()
        .eq('id', id);
        
      if (error) {
        throw error;
      }
      
      toast.success('Payment method removed');
      fetchPaymentMethods();
    } catch (err) {
      console.error('Error removing payment method:', err);
      toast.error('Failed to remove payment method');
    }
  };
  
  if (isLoading) {
    return <div className="py-8 text-center">Loading payment methods...</div>;
  }
  
  if (paymentMethods.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-muted-foreground mb-4">No payment methods saved yet.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {paymentMethods.map((method) => (
        <Card key={method.id}>
          <CardHeader className="py-3">
            <CardTitle className="text-base flex items-center">
              <CreditCard className="h-5 w-5 mr-2" />
              {method.card_type} ending in {method.last_four}
              {method.is_default && (
                <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                  Default
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="py-3 pt-0 flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              Expires {method.exp_month}/{method.exp_year}
            </div>
            <div className="flex space-x-2">
              {!method.is_default && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleSetDefault(method.id)}
                >
                  Set Default
                </Button>
              )}
              <Button 
                variant="destructive" 
                size="icon"
                onClick={() => handleRemove(method.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default SavedPaymentMethods;
