import React, { useState } from 'react';
import { RefreshCw, ChevronDown, Bell, CreditCard, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { triggerHapticFeedback } from '@/utils/haptics';
import { motion, AnimatePresence } from 'framer-motion';
import UnifiedPaymentMethodManager from '@/components/payments/UnifiedPaymentMethodManager';

interface PaymentMethodInfo {
  id: string;
  stripe_payment_method_id: string;
  last_four: string;
  card_type: string;
}

interface RecurringToggleSectionProps {
  isRecurring: boolean;
  onToggle: (enabled: boolean) => void;
  detectedHoliday?: { key: string; label: string } | null;
  budget: number;
  onBudgetChange: (budget: number) => void;
  paymentMethodId: string;
  onPaymentMethodChange: (id: string) => void;
  autoApprove: boolean;
  onAutoApproveChange: (enabled: boolean) => void;
  notificationDays: number[];
  onNotificationDaysChange: (days: number[]) => void;
  className?: string;
}

const BUDGET_PRESETS = [25, 50, 75, 100];

const RecurringToggleSection: React.FC<RecurringToggleSectionProps> = ({
  isRecurring,
  onToggle,
  detectedHoliday,
  budget,
  onBudgetChange,
  paymentMethodId,
  onPaymentMethodChange,
  autoApprove,
  onAutoApproveChange,
  notificationDays,
  onNotificationDaysChange,
  className
}) => {
  const [customBudget, setCustomBudget] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const handleToggle = (checked: boolean) => {
    triggerHapticFeedback(checked ? 'medium' : 'light');
    onToggle(checked);
  };

  const handleBudgetSelect = (amount: number) => {
    triggerHapticFeedback('light');
    setShowCustomInput(false);
    onBudgetChange(amount);
  };

  const handleCustomBudgetChange = (value: string) => {
    setCustomBudget(value);
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue > 0) {
      onBudgetChange(numValue);
    }
  };

  const handleNotificationToggle = (days: number) => {
    triggerHapticFeedback('light');
    if (notificationDays.includes(days)) {
      onNotificationDaysChange(notificationDays.filter(d => d !== days));
    } else {
      onNotificationDaysChange([...notificationDays, days].sort((a, b) => b - a));
    }
  };

  const isPresetSelected = (amount: number) => budget === amount && !showCustomInput;

  return (
    <div className={cn("space-y-4", className)}>
      <Separator />
      
      {/* Toggle Header */}
      <div 
        className={cn(
          "flex items-center justify-between p-4 rounded-lg border transition-colors cursor-pointer min-h-[56px]",
          isRecurring ? "bg-primary/5 border-primary/20" : "bg-muted/30 border-border"
        )}
        onClick={() => handleToggle(!isRecurring)}
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            "flex h-9 w-9 items-center justify-center rounded-full",
            isRecurring ? "bg-primary/10" : "bg-muted"
          )}>
            <RefreshCw className={cn(
              "h-4 w-4",
              isRecurring ? "text-primary" : "text-muted-foreground"
            )} />
          </div>
          <div>
            <p className="font-medium text-sm">Make this a recurring gift</p>
            <p className="text-xs text-muted-foreground">
              {detectedHoliday 
                ? `Automatically send a gift every ${detectedHoliday.label}`
                : "Automatically send a gift for this occasion yearly"
              }
            </p>
          </div>
        </div>
        <Switch 
          checked={isRecurring} 
          onCheckedChange={handleToggle}
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      {/* Expandable Options */}
      <AnimatePresence>
        {isRecurring && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="space-y-5 pt-2 pb-1">
              {/* Nicole AI Explanation */}
              <div className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/10">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 flex-shrink-0 mt-0.5">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Nicole AI picks the perfect gift</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    We'll choose gifts based on their wishlist, interests, and past preferences—so you never have to guess.
                  </p>
                </div>
              </div>

              {/* Budget Selection */}
              <div>
                <Label className="text-sm font-semibold mb-3 block">
                  Gift Budget
                </Label>
                <div className="flex flex-wrap gap-2">
                  {BUDGET_PRESETS.map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => handleBudgetSelect(amount)}
                      className={cn(
                        "px-4 py-2.5 rounded-full text-sm font-medium transition-all min-h-[44px]",
                        "border touch-manipulation",
                        isPresetSelected(amount)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background hover:bg-accent border-border"
                      )}
                    >
                      ${amount}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      triggerHapticFeedback('light');
                      setShowCustomInput(true);
                    }}
                    className={cn(
                      "px-4 py-2.5 rounded-full text-sm font-medium transition-all min-h-[44px]",
                      "border touch-manipulation",
                      showCustomInput
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background hover:bg-accent border-border"
                    )}
                  >
                    Custom
                  </button>
                </div>
                
                {showCustomInput && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3"
                  >
                    <div className="relative w-32">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <Input
                        type="number"
                        value={customBudget}
                        onChange={(e) => handleCustomBudgetChange(e.target.value)}
                        placeholder="Amount"
                        className="pl-7 h-11 text-base"
                        min={1}
                        max={1000}
                      />
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Payment Method */}
              <div>
                <Label className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Payment Method
                </Label>
                <div className="border rounded-lg">
                  <UnifiedPaymentMethodManager
                    mode="selection"
                    selectedMethodId={paymentMethodId}
                    onSelectMethod={(method) => onPaymentMethodChange(method.stripe_payment_method_id || method.id)}
                  />
                </div>
              </div>

              {/* Notifications */}
              <div>
                <Label className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Notify me before sending
                </Label>
                <div className="flex flex-wrap gap-2">
                  {[7, 3, 1].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => handleNotificationToggle(days)}
                      className={cn(
                        "px-3 py-2 rounded-lg text-sm font-medium transition-all min-h-[40px]",
                        "border touch-manipulation",
                        notificationDays.includes(days)
                          ? "bg-primary/10 text-primary border-primary/30"
                          : "bg-background hover:bg-accent border-border"
                      )}
                    >
                      {days} day{days > 1 ? 's' : ''} before
                    </button>
                  ))}
                </div>
              </div>

              {/* Auto-Approve Toggle */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 min-h-[52px]">
                <div>
                  <p className="text-sm font-medium">Auto-approve gifts</p>
                  <p className="text-xs text-muted-foreground">
                    Skip approval and send automatically
                  </p>
                </div>
                <Switch 
                  checked={autoApprove}
                  onCheckedChange={(checked) => {
                    triggerHapticFeedback('light');
                    onAutoApproveChange(checked);
                  }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RecurringToggleSection;
