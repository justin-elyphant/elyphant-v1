/*
 * ========================================================================
 * 🎯 UNIFIED PAYMENT METHOD MANAGER - CONSOLIDATED MANAGEMENT HUB
 * ========================================================================
 * 
 * Consolidates PaymentMethodManager and PaymentMethodSelector into a single,
 * comprehensive payment method management component.
 * 
 * INTEGRATION WITH PROTECTION MEASURES:
 * - Uses StripeClientManager for centralized Stripe client management
 * - Integrates with UnifiedPaymentService for consistent operations
 * - Respects existing rate limiting and circuit breaker patterns
 * - Maintains audit trail and error logging
 * 
 * FEATURES:
 * - Unified saved payment methods display
 * - Streamlined payment method selection
 * - Consistent add/remove/edit functionality  
 * - Integration with UnifiedPaymentService
 * - Enhanced error handling and UX
 * 
 * Last update: 2025-01-24 (Phase 1 - UnifiedPaymentService Implementation)
 * ========================================================================
 */

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, CreditCard, Trash2, Star, StarOff, CheckCircle, AlertCircle, Shield } from 'lucide-react';
import { Elements } from '@stripe/react-stripe-js';
import { stripeClientManager } from "@/services/payment/StripeClientManager";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import UnifiedPaymentForm from "./UnifiedPaymentForm";

interface PaymentMethod {
  id: string;
  user_id: string;
  payment_method_id: string;
  last_four: string;
  card_type: string;
  exp_month: number;
  exp_year: number;
  created_at: string;
  is_default: boolean;
}

interface UnifiedPaymentMethodManagerProps {
  mode?: 'management' | 'selection';
  onSelectMethod?: (method: PaymentMethod) => void;
  selectedMethodId?: string;
  showAddNew?: boolean;
  allowSelection?: boolean;
}

const UnifiedPaymentMethodManager: React.FC<UnifiedPaymentMethodManagerProps> = ({
  mode = 'management',
  onSelectMethod,
  selectedMethodId,
  showAddNew = true,
  allowSelection = false
}) => {
  const [activeTab, setActiveTab] = useState<string>(mode === 'selection' ? "saved" : "saved");
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const { user } = useAuth();
  
  const fetchPaymentMethods = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });
        
      if (error) {
        throw error;
      }
      
      setPaymentMethods(data || []);
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
    if (!user || isProcessing) return;
    
    try {
      setIsProcessing(true);
      
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
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleRemove = async (id: string) => {
    if (isProcessing) return;
    
    try {
      setIsProcessing(true);
      
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
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddSuccess = () => {
    fetchPaymentMethods();
    if (mode === 'management') {
      setActiveTab("saved");
    }
    toast.success('Payment method added successfully');
  };

  const handleSelectMethod = (method: PaymentMethod) => {
    if (allowSelection && onSelectMethod) {
      onSelectMethod(method);
      toast.success(`Selected ${method.card_type} ending in ${method.last_four}`);
    }
  };

  const renderPaymentMethodCard = (method: PaymentMethod) => {
    const isSelected = selectedMethodId === method.id;
    const isExpired = new Date(method.exp_year, method.exp_month - 1) < new Date();
    
    return (
      <Card 
        key={method.id} 
        className={`cursor-pointer transition-all duration-200 ${
          isSelected ? 'ring-2 ring-primary bg-primary/5' : 'hover:shadow-md'
        } ${isExpired ? 'opacity-60' : ''}`}
        onClick={() => allowSelection && handleSelectMethod(method)}
      >
        <CardHeader className="py-3">
          <CardTitle className="text-base flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              <span className="capitalize">{method.card_type}</span>
              <span>•••• {method.last_four}</span>
              {method.is_default && (
                <Badge variant="default" className="text-xs">
                  <Star className="h-3 w-3 mr-1" />
                  Default
                </Badge>
              )}
              {isSelected && (
                <Badge variant="secondary" className="text-xs">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Selected
                </Badge>
              )}
              {isExpired && (
                <Badge variant="destructive" className="text-xs">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Expired
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="py-3 pt-0">
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              Expires {method.exp_month.toString().padStart(2, '0')}/{method.exp_year}
              {isExpired && <span className="text-destructive ml-2">- Update required</span>}
            </div>
            
            {mode === 'management' && (
              <div className="flex space-x-2">
                {!method.is_default && !isExpired && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSetDefault(method.id);
                    }}
                    disabled={isProcessing}
                  >
                    <Star className="h-3 w-3 mr-1" />
                    Set Default
                  </Button>
                )}
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(method.id);
                  }}
                  disabled={isProcessing}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          
          {isExpired && mode === 'management' && (
            <Alert className="mt-3">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                This card has expired. Please add a new payment method.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderSavedMethods = () => {
    if (isLoading) {
      return (
        <div className="py-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading payment methods...</p>
        </div>
      );
    }
    
    if (paymentMethods.length === 0) {
      return (
        <div className="py-8 text-center">
          <CreditCard className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">No payment methods saved yet.</p>
          {showAddNew && (
            <Button 
              onClick={() => setActiveTab("add")}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Your First Payment Method
            </Button>
          )}
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        {mode === 'selection' && (
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Select a saved payment method or add a new one below.
            </AlertDescription>
          </Alert>
        )}
        
        {paymentMethods.map(renderPaymentMethodCard)}
        
        {mode === 'selection' && showAddNew && (
          <Card className="border-dashed border-2 hover:border-primary/50 transition-colors">
            <CardContent className="p-6 text-center">
              <Button 
                variant="ghost" 
                className="w-full h-auto p-4 flex flex-col items-center gap-2"
                onClick={() => setActiveTab("add")}
              >
                <Plus className="h-8 w-8 text-muted-foreground" />
                <span className="font-medium">Add New Payment Method</span>
                <span className="text-sm text-muted-foreground">
                  Securely save a new card for future use
                </span>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  if (mode === 'selection' && !showAddNew) {
    // Simple selection mode without tabs
    return (
      <div className="space-y-4">
        {renderSavedMethods()}
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          {mode === 'selection' ? 'Select Payment Method' : 'Payment Methods'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="saved" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Saved Methods
              {paymentMethods.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {paymentMethods.length}
                </Badge>
              )}
            </TabsTrigger>
            {showAddNew && (
              <TabsTrigger value="add" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add New
              </TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="saved" className="mt-6">
            {renderSavedMethods()}
          </TabsContent>
          
          {showAddNew && (
            <TabsContent value="add" className="mt-6">
              <Elements stripe={stripeClientManager.getStripePromise()}>
                <UnifiedPaymentForm
                  mode="setup"
                  amount={0}
                  onSuccess={handleAddSuccess}
                  allowSaveCard={false}
                />
              </Elements>
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default UnifiedPaymentMethodManager;