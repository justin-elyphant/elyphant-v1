import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { CheckCircle, CreditCard, Shield, Lock, Loader2, PlusCircle } from "lucide-react";
import { GiftSetupData } from "../GiftSetupWizard";
import { useAuth } from "@/contexts/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import PaymentMethodSelector from "../events/edit-drawer/gift-settings/PaymentMethodSelector";
import { useNavigate } from "react-router-dom";

interface WizardStepFourProps {
  data: GiftSetupData;
  onNext: (stepData: Partial<GiftSetupData>) => void;
  isLoading: boolean;
}

export const WizardStepFour: React.FC<WizardStepFourProps> = ({ data, onNext, isLoading }) => {
  console.log("WizardStepFour rendering with data:", data);
  
  const [paymentAdded, setPaymentAdded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string | undefined>(data.selectedPaymentMethodId);
  const [showAddNew, setShowAddNew] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch payment methods on component mount
  useEffect(() => {
    const fetchPaymentMethods = async () => {
      if (!user) return;
      
      try {
        const { data: methods, error } = await supabase
          .from('payment_methods')
          .select('id, payment_method_id, last_four, card_type, is_default')
          .eq('user_id', user.id)
          .order('is_default', { ascending: false });
          
        if (error) throw error;
        
        setPaymentMethods(methods || []);
        
        // If no payment method is selected but we have methods, select the default one
        if (!selectedPaymentMethodId && methods && methods.length > 0) {
          const defaultMethod = methods.find(m => m.is_default) || methods[0];
          setSelectedPaymentMethodId(defaultMethod.id);
        }
      } catch (err) {
        console.error('Error fetching payment methods:', err);
      }
    };
    
    fetchPaymentMethods();
  }, [user, selectedPaymentMethodId]);

  // Only show payment step if auto-gifting is enabled
  React.useEffect(() => {
    if (!data.autoGiftingEnabled) {
      console.log("Auto-gifting disabled, skipping payment step");
      onNext({ hasPaymentMethod: false });
    }
  }, [data.autoGiftingEnabled, onNext]);

  const handlePaymentSuccess = async () => {
    setPaymentAdded(true);
    
    // Update auto-gifting settings to indicate payment method is available
    if (user?.id) {
      try {
        const { error } = await supabase
          .from('auto_gifting_settings')
          .upsert({
            user_id: user.id,
            has_payment_method: true,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' });

        if (error) {
          console.error('Error updating payment method status:', error);
        }
      } catch (err) {
        console.error('Failed to update auto-gifting settings:', err);
      }
    }
    
    toast.success("Payment method added successfully!");
  };

  const handleContinue = () => {
    onNext({ 
      hasPaymentMethod: paymentAdded || !!selectedPaymentMethodId,
      selectedPaymentMethodId: selectedPaymentMethodId
    });
  };

  const handlePaymentMethodSelect = (paymentMethodId: string) => {
    if (paymentMethodId === 'add-new') {
      setShowAddNew(true);
    } else {
      setSelectedPaymentMethodId(paymentMethodId);
      setShowAddNew(false);
    }
  };


  // Only show payment step if auto-gifting is enabled
  if (!data.autoGiftingEnabled) {
    return null;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Method Setup
          </CardTitle>
          <CardDescription>
            A payment method is required to enable auto-gifting for {data.recipientName}. 
            Your payment information is securely stored and encrypted.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Security Badge */}
          <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
            <Shield className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-800">Secure & Encrypted</p>
              <p className="text-sm text-green-700">
                Your payment details are protected by Stripe's industry-leading security
              </p>
            </div>
          </div>

          {/* Payment Method Selection */}
          {!paymentAdded && !showAddNew && paymentMethods.length > 0 ? (
            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium">Select Payment Method</Label>
                <p className="text-sm text-muted-foreground mb-4">
                  Choose a payment method for auto-gifting to {data.recipientName}
                </p>
                <PaymentMethodSelector 
                  selectedPaymentMethodId={selectedPaymentMethodId}
                  onSelect={handlePaymentMethodSelect}
                />
              </div>

              <div className="flex items-center gap-2 pt-4 border-t">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  We'll only charge your card when you approve a gift purchase. 
                  You'll receive notifications before each transaction.
                </p>
              </div>
            </div>
          ) : !paymentAdded && (paymentMethods.length === 0 || showAddNew) ? (
            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium">Add New Payment Method</Label>
                <p className="text-sm text-muted-foreground mb-4">
                  Add a payment method to enable auto-gifting
                </p>
              </div>
              <div className="p-4 border border-dashed border-muted-foreground/50 rounded-lg">
                <p className="text-sm text-muted-foreground text-center">
                  Payment method setup will be implemented here with Stripe Elements
                </p>
                <Button 
                  onClick={handlePaymentSuccess} 
                  className="w-full mt-2"
                  variant="outline"
                >
                  Demo: Add Payment Method
                </Button>
              </div>
              {paymentMethods.length > 0 && (
                <Button 
                  variant="outline"
                  onClick={() => setShowAddNew(false)}
                  className="w-full"
                >
                  Use Existing Payment Method
                </Button>
              )}

              <div className="flex items-center gap-2 pt-4 border-t">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  We'll only charge your card when you approve a gift purchase. 
                  You'll receive notifications before each transaction.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-800">Payment Method Ready!</p>
                <p className="text-sm text-green-700">
                  You're all set for auto-gifting. We'll notify you before each purchase.
                </p>
              </div>
            </div>
          )}

          {/* Auto-purchase Settings */}
          <Card className="border-muted">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Auto-approve purchases</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically purchase gifts without manual approval (up to your budget limit)
                    </p>
                  </div>
                  <Switch 
                    checked={data.autoApproveEnabled || false}
                    onCheckedChange={(checked) => onNext({ autoApproveEnabled: checked })}
                  />
                </div>
                
                <div className="text-sm text-muted-foreground">
                  Budget limit: ${data.budgetLimit || 100} per gift
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end">
        <Button 
          onClick={handleContinue}
          disabled={(!paymentAdded && !selectedPaymentMethodId) || isLoading || isProcessing}
          size="lg"
          className="min-w-40"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Setting up...
            </>
          ) : (
            <>
              Continue
              {(paymentAdded || selectedPaymentMethodId) && <CheckCircle className="h-4 w-4 ml-2" />}
            </>
          )}
        </Button>
      </div>
    </div>
  );
};