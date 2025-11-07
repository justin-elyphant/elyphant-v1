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
import { Plus, CreditCard, Trash2, Star, StarOff, CheckCircle, AlertCircle, Shield, ArrowLeft } from 'lucide-react';
import { Elements } from '@stripe/react-stripe-js';
import { stripeClientManager } from "@/services/payment/StripeClientManager";
import { useAuth } from "@/contexts/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import UnifiedPaymentForm from "./UnifiedPaymentForm";
import { PaymentMethodHealthBadge } from "./PaymentMethodHealthBadge";

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
  const [rulesCount, setRulesCount] = useState<Map<string, number>>(new Map());
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
      
      // Map database fields to component interface
      const mappedData = (data || []).map(method => ({
        ...method,
        payment_method_id: method.stripe_payment_method_id
      }));
      setPaymentMethods(mappedData);

      // Fetch rules count for each payment method
      const { data: rulesData } = await supabase
        .from('auto_gifting_rules')
        .select('payment_method_id')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (rulesData) {
        const counts = new Map<string, number>();
        rulesData.forEach(rule => {
          if (rule.payment_method_id) {
            counts.set(rule.payment_method_id, (counts.get(rule.payment_method_id) || 0) + 1);
          }
        });
        setRulesCount(counts);
      }
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
    const now = new Date();
    const expDate = new Date(method.exp_year, method.exp_month - 1);
    const monthsUntilExpiry = (expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30);
    const isExpiringSoon = !isExpired && monthsUntilExpiry <= 1;
    const methodRulesCount = rulesCount.get(method.id) || 0;
    
    let healthStatus: 'valid' | 'expired' | 'expiring_soon' | 'invalid' | 'detached' = 'valid';
    if (isExpired) {
      healthStatus = 'expired';
    } else if (isExpiringSoon) {
      healthStatus = 'expiring_soon';
    }
    
    return (
      <Card 
        key={method.id} 
        className={`cursor-pointer transition-all duration-200 touch-manipulation ios-scroll w-full max-w-full overflow-hidden ${
          isSelected ? 'ring-2 ring-primary bg-primary/5' : 'hover:shadow-md'
        } ${isExpired ? 'opacity-60' : ''}`}
        onClick={() => allowSelection && handleSelectMethod(method)}
      >
        <CardHeader className="py-2 sm:py-3 px-3 sm:px-6">
          <CardTitle className="text-sm sm:text-base">
            <div className="flex flex-col gap-2 w-full min-w-0">
              <div className="flex items-center gap-2 min-w-0 flex-wrap">
                <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                <span className="capitalize text-sm sm:text-base truncate">{method.card_type}</span>
                <span className="text-sm sm:text-base">•••• {method.last_four}</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                {method.is_default && (
                  <Badge variant="default" className="text-xs px-1 py-0">
                    <Star className="h-2 w-2 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                    Default
                  </Badge>
                )}
                {isSelected && (
                  <Badge variant="secondary" className="text-xs px-1 py-0">
                    <CheckCircle className="h-2 w-2 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                    Selected
                  </Badge>
                )}
                <PaymentMethodHealthBadge 
                  status={healthStatus}
                  expirationDate={expDate}
                  className="text-xs px-1 py-0"
                />
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="py-2 sm:py-3 pt-0 px-3 sm:px-6">
          <div className="flex flex-col gap-3 w-full min-w-0">
            <div className="space-y-1">
              <div className="text-xs sm:text-sm text-muted-foreground">
                Expires {method.exp_month.toString().padStart(2, '0')}/{method.exp_year}
                {isExpired && <span className="text-destructive ml-1 sm:ml-2 block sm:inline">- Update required</span>}
              </div>
              {methodRulesCount > 0 && (
                <div className="text-xs text-muted-foreground">
                  Used by {methodRulesCount} auto-gift rule{methodRulesCount !== 1 ? 's' : ''}
                </div>
              )}
            </div>
            
            {mode === 'management' && (
              <div className="flex gap-2 touch-manipulation flex-wrap">
                {!method.is_default && !isExpired && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="min-h-[44px] px-2 sm:px-3 text-xs flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSetDefault(method.id);
                    }}
                    disabled={isProcessing}
                  >
                    <Star className="h-3 w-3 mr-1" />
                    <span className="hidden sm:inline">Set Default</span>
                    <span className="sm:hidden">Default</span>
                  </Button>
                )}
                <Button 
                  variant="destructive" 
                  size="sm"
                  className="min-h-[44px] min-w-[44px] px-2 flex-shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(method.id);
                  }}
                  disabled={isProcessing}
                >
                  <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
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
      <div className="space-y-4 w-full overflow-x-hidden">
        {mode === 'selection' && (
          <Alert className="mx-0">
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Select a saved payment method or add a new one below.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="w-full space-y-4 overflow-x-hidden">
          {paymentMethods.map(renderPaymentMethodCard)}
        </div>
        
        {showAddNew && (
          <Card className="border-dashed border-2 hover:border-primary/50 transition-colors w-full max-w-full mb-6 sm:mb-4">
            <CardContent className="p-4 sm:p-6 text-center">
              <Button 
                variant="ghost" 
                className="w-full h-auto p-3 sm:p-4 flex flex-col items-center gap-2 touch-manipulation"
                onClick={() => setActiveTab("add")}
              >
                <Plus className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
                <span className="font-medium text-sm sm:text-base">Add New Payment Method</span>
                <span className="text-xs sm:text-sm text-muted-foreground">
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
    <div className="w-full max-w-full overflow-x-hidden">
      <div className="w-full">
        {activeTab === "add" ? (
          <div className="space-y-4 w-full overflow-x-hidden">
            <div className="flex items-center gap-2 pb-4 border-b">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setActiveTab("saved")}
                className="flex items-center gap-2 touch-manipulation"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Back to Saved Methods</span>
                <span className="sm:hidden">Back</span>
              </Button>
            </div>
            <Elements stripe={stripeClientManager.getStripePromise()}>
              <UnifiedPaymentForm
                mode="setup"
                amount={0}
                onSuccess={handleAddSuccess}
                allowSaveCard={false}
              />
            </Elements>
          </div>
        ) : (
          renderSavedMethods()
        )}
      </div>
    </div>
  );
};

export default UnifiedPaymentMethodManager;