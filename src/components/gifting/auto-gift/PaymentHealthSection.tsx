import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, CheckCircle, AlertTriangle, XCircle, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth';
import { toast } from 'sonner';
import { PaymentMethodHealthBadge } from '@/components/payments/PaymentMethodHealthBadge';

interface PaymentMethodHealth {
  payment_method_id: string;
  last_four: string;
  card_type: string;
  exp_month: number;
  exp_year: number;
  status: 'valid' | 'expired' | 'expiring_soon' | 'invalid' | 'detached';
  rules_count: number;
  rule_ids: string[];
  last_verified?: string;
}

interface PaymentHealthSectionProps {
  settings: any;
  onUpdateSettings: (updates: any) => void;
}

const PaymentHealthSection: React.FC<PaymentHealthSectionProps> = ({
  settings,
  onUpdateSettings
}) => {
  const { user } = useAuth();
  const [healthData, setHealthData] = useState<PaymentMethodHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastCheck, setLastCheck] = useState<Date>(new Date());

  const loadPaymentHealth = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // Get all payment methods
      const { data: paymentMethods, error: pmError } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', user.id);

      if (pmError) throw pmError;

      // Get all active auto-gift rules
      const { data: rules, error: rulesError } = await supabase
        .from('auto_gifting_rules')
        .select('id, payment_method_id, payment_method_status, payment_method_last_verified')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (rulesError) throw rulesError;

      // Build health data
      const healthMap = new Map<string, PaymentMethodHealth>();

      paymentMethods?.forEach(pm => {
        const pmRules = rules?.filter(r => r.payment_method_id === pm.id) || [];
        const now = new Date();
        const expDate = new Date(pm.exp_year, pm.exp_month - 1);
        const monthsUntilExpiry = (expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30);

        let status: 'valid' | 'expired' | 'expiring_soon' | 'invalid' | 'detached' = 'valid';
        
        if (expDate < now) {
          status = 'expired';
        } else if (monthsUntilExpiry <= 1) {
          status = 'expiring_soon';
        }

        // Check if any rule has this payment method marked as invalid/detached
        const hasInvalidRule = pmRules.some(r => 
          r.payment_method_status === 'invalid' || 
          r.payment_method_status === 'detached'
        );
        
        if (hasInvalidRule) {
          status = pmRules.find(r => r.payment_method_status === 'detached') ? 'detached' : 'invalid';
        }

        healthMap.set(pm.id, {
          payment_method_id: pm.id,
          last_four: pm.last_four,
          card_type: pm.card_type,
          exp_month: pm.exp_month,
          exp_year: pm.exp_year,
          status,
          rules_count: pmRules.length,
          rule_ids: pmRules.map(r => r.id),
          last_verified: pmRules[0]?.payment_method_last_verified
        });
      });

      setHealthData(Array.from(healthMap.values()));
      setLastCheck(new Date());
    } catch (error) {
      console.error('Error loading payment health:', error);
      toast.error('Failed to load payment health data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPaymentHealth();
  }, [user?.id]);

  const getOverallHealth = () => {
    const hasExpired = healthData.some(h => h.status === 'expired' || h.status === 'invalid' || h.status === 'detached');
    const hasExpiring = healthData.some(h => h.status === 'expiring_soon');

    if (hasExpired) {
      return {
        status: 'error',
        icon: <XCircle className="h-5 w-5 text-destructive" />,
        message: 'Action required: Some payment methods need attention',
        color: 'destructive'
      };
    } else if (hasExpiring) {
      return {
        status: 'warning',
        icon: <AlertTriangle className="h-5 w-5 text-yellow-600" />,
        message: 'Warning: Some payment methods are expiring soon',
        color: 'secondary'
      };
    } else {
      return {
        status: 'healthy',
        icon: <CheckCircle className="h-5 w-5 text-green-600" />,
        message: 'All payment methods are valid',
        color: 'default'
      };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        Loading payment health...
      </div>
    );
  }

  const overallHealth = getOverallHealth();

  return (
    <div className="space-y-6">
      {/* Overall Health Status */}
      <Alert className="border-2">
        <div className="flex items-center gap-3">
          {overallHealth.icon}
          <div className="flex-1">
            <AlertDescription className="font-medium">
              {overallHealth.message}
            </AlertDescription>
            <p className="text-xs text-muted-foreground mt-1">
              Last checked: {lastCheck.toLocaleTimeString()}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadPaymentHealth}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </Alert>

      {/* Payment Method Health Cards */}
      <div className="space-y-4">
        {healthData.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No payment methods found</p>
            </CardContent>
          </Card>
        ) : (
          healthData.map((health) => (
            <Card key={health.payment_method_id} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <span className="capitalize">{health.card_type}</span>
                      <span>•••• {health.last_four}</span>
                    </CardTitle>
                    <CardDescription>
                      Expires {health.exp_month.toString().padStart(2, '0')}/{health.exp_year}
                    </CardDescription>
                  </div>
                  <PaymentMethodHealthBadge 
                    status={health.status}
                    expirationDate={new Date(health.exp_year, health.exp_month - 1)}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Used by auto-gift rules:</span>
                    <Badge variant="outline">{health.rules_count} rule{health.rules_count !== 1 ? 's' : ''}</Badge>
                  </div>

                  {health.last_verified && (
                    <div className="text-xs text-muted-foreground">
                      Last verified: {new Date(health.last_verified).toLocaleString()}
                    </div>
                  )}

                  {(health.status === 'expired' || health.status === 'invalid' || health.status === 'detached') && health.rules_count > 0 && (
                    <Alert variant="destructive" className="mt-3">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        {health.rules_count} auto-gift rule{health.rules_count !== 1 ? 's are' : ' is'} using this {health.status} payment method. 
                        Update the payment method to avoid failed transactions.
                      </AlertDescription>
                    </Alert>
                  )}

                  {health.status === 'expiring_soon' && health.rules_count > 0 && (
                    <Alert className="mt-3">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        This card expires soon. Update it before it affects your auto-gift rules.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default PaymentHealthSection;
