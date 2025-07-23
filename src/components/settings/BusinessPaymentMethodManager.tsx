import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, CreditCard, Trash2, Check, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface BusinessPaymentMethod {
  id: string;
  name: string;
  name_on_card: string;
  card_type: string;
  last_four: string;
  exp_month: number;
  exp_year: number;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
}

const BusinessPaymentMethodManager = () => {
  const [paymentMethods, setPaymentMethods] = useState<BusinessPaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    nameOnCard: '',
    cardNumber: '',
    expMonth: '',
    expYear: '',
    cvv: '',
    isDefault: false
  });

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('manage-business-payment-methods', {
        body: { action: 'list' }
      });

      if (error) throw error;

      if (data.success) {
        setPaymentMethods(data.data || []);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      toast.error('Failed to load payment methods');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPaymentMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);

    try {
      const { data, error } = await supabase.functions.invoke('manage-business-payment-methods', {
        body: { 
          action: 'add',
          paymentMethod: formData
        }
      });

      if (error) throw error;

      if (data.success) {
        setPaymentMethods(prev => [data.data, ...prev]);
        setShowAddForm(false);
        setFormData({
          name: '',
          nameOnCard: '',
          cardNumber: '',
          expMonth: '',
          expYear: '',
          cvv: '',
          isDefault: false
        });
        toast.success('Business payment method added successfully');
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error adding payment method:', error);
      toast.error('Failed to add payment method');
    } finally {
      setIsAdding(false);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('manage-business-payment-methods', {
        body: { 
          action: 'setDefault',
          paymentMethod: { id }
        }
      });

      if (error) throw error;

      if (data.success) {
        setPaymentMethods(prev => 
          prev.map(method => ({
            ...method,
            is_default: method.id === id
          }))
        );
        toast.success('Default payment method updated');
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error setting default:', error);
      toast.error('Failed to set default payment method');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('manage-business-payment-methods', {
        body: { 
          action: 'delete',
          paymentMethod: { id }
        }
      });

      if (error) throw error;

      if (data.success) {
        setPaymentMethods(prev => prev.filter(method => method.id !== id));
        toast.success('Payment method removed');
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error deleting payment method:', error);
      toast.error('Failed to remove payment method');
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const getCardTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'visa':
        return '💳';
      case 'mastercard':
        return '💳';
      case 'amex':
        return '💳';
      case 'discover':
        return '💳';
      default:
        return '💳';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-6 bg-muted rounded w-48 mb-4"></div>
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Business Payment Methods</h2>
          <p className="text-muted-foreground">
            Manage business credit cards for Amazon Business orders via Zinc API
          </p>
        </div>
        <Button onClick={() => setShowAddForm(true)} disabled={showAddForm}>
          <Plus className="h-4 w-4 mr-2" />
          Add Payment Method
        </Button>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-amber-800 mb-1">Security Notice</p>
            <p className="text-amber-700">
              These payment methods are used exclusively for automated Amazon Business purchases through the Zinc API. 
              All card data is encrypted and only accessible by the system for order processing.
            </p>
          </div>
        </div>
      </div>

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add Business Payment Method</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddPaymentMethod} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Display Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Company Visa"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="nameOnCard">Name on Card</Label>
                  <Input
                    id="nameOnCard"
                    value={formData.nameOnCard}
                    onChange={(e) => setFormData(prev => ({ ...prev, nameOnCard: e.target.value }))}
                    placeholder="Full name as on card"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="cardNumber">Card Number</Label>
                <Input
                  id="cardNumber"
                  value={formData.cardNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, cardNumber: formatCardNumber(e.target.value) }))}
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="expMonth">Exp Month</Label>
                  <Input
                    id="expMonth"
                    value={formData.expMonth}
                    onChange={(e) => setFormData(prev => ({ ...prev, expMonth: e.target.value }))}
                    placeholder="MM"
                    maxLength={2}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="expYear">Exp Year</Label>
                  <Input
                    id="expYear"
                    value={formData.expYear}
                    onChange={(e) => setFormData(prev => ({ ...prev, expYear: e.target.value }))}
                    placeholder="YYYY"
                    maxLength={4}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="cvv">CVV</Label>
                  <Input
                    id="cvv"
                    type="password"
                    value={formData.cvv}
                    onChange={(e) => setFormData(prev => ({ ...prev, cvv: e.target.value }))}
                    placeholder="123"
                    maxLength={4}
                    required
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData(prev => ({ ...prev, isDefault: e.target.checked }))}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="isDefault">Set as default payment method</Label>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={isAdding}>
                  {isAdding ? "Adding..." : "Add Payment Method"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {paymentMethods.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">No Payment Methods</p>
              <p className="text-muted-foreground text-center mb-4">
                Add a business payment method to enable automated Amazon Business orders
              </p>
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Payment Method
              </Button>
            </CardContent>
          </Card>
        ) : (
          paymentMethods.map((method) => (
            <Card key={method.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-2xl">
                      {getCardTypeIcon(method.card_type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">{method.name}</h3>
                        {method.is_default && (
                          <Badge variant="secondary">
                            <Check className="h-3 w-3 mr-1" />
                            Default
                          </Badge>
                        )}
                        <Badge variant="outline" className="capitalize">
                          {method.card_type}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {method.name_on_card} • **** **** **** {method.last_four}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Expires {method.exp_month.toString().padStart(2, '0')}/{method.exp_year}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
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
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(method.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default BusinessPaymentMethodManager;