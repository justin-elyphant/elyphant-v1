
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { DollarSign, TrendingUp, Calendar, PiggyBank } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { UnifiedGiftSettings } from "@/services/UnifiedGiftManagementService";

interface BudgetTrackingSectionProps {
  settings: UnifiedGiftSettings | null;
  onUpdateSettings: (updates: Partial<UnifiedGiftSettings>) => void;
}

const BudgetTrackingSection = ({ settings, onUpdateSettings }: BudgetTrackingSectionProps) => {
  const [monthlyLimit, setMonthlyLimit] = useState(settings?.budget_tracking?.monthly_limit || "");
  const [annualLimit, setAnnualLimit] = useState(settings?.budget_tracking?.annual_limit || "");
  const [defaultBudget, setDefaultBudget] = useState(settings?.default_budget_limit || 50);

  const handleSave = () => {
    onUpdateSettings({
      default_budget_limit: defaultBudget,
      budget_tracking: {
        ...settings?.budget_tracking,
        monthly_limit: monthlyLimit ? parseFloat(monthlyLimit.toString()) : null,
        annual_limit: annualLimit ? parseFloat(annualLimit.toString()) : null,
      }
    });
  };

  const spentThisMonth = settings?.budget_tracking?.spent_this_month || 0;
  const spentThisYear = settings?.budget_tracking?.spent_this_year || 0;
  const monthlyLimitNum = settings?.budget_tracking?.monthly_limit || 0;
  const annualLimitNum = settings?.budget_tracking?.annual_limit || 0;

  const monthlyProgress = monthlyLimitNum > 0 ? (spentThisMonth / monthlyLimitNum) * 100 : 0;
  const annualProgress = annualLimitNum > 0 ? (spentThisYear / annualLimitNum) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Current Spending Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Spending Overview
          </CardTitle>
          <CardDescription>Track your automated gifting expenses</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  This Month
                </Label>
                <span className="text-sm font-medium">
                  {formatPrice(spentThisMonth)}
                  {monthlyLimitNum > 0 && ` / ${formatPrice(monthlyLimitNum)}`}
                </span>
              </div>
              {monthlyLimitNum > 0 && (
                <Progress 
                  value={monthlyProgress} 
                  className="h-2"
                  max={100}
                />
              )}
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="flex items-center">
                  <PiggyBank className="h-4 w-4 mr-2" />
                  This Year
                </Label>
                <span className="text-sm font-medium">
                  {formatPrice(spentThisYear)}
                  {annualLimitNum > 0 && ` / ${formatPrice(annualLimitNum)}`}
                </span>
              </div>
              {annualLimitNum > 0 && (
                <Progress 
                  value={annualProgress} 
                  className="h-2"
                  max={100}
                />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Budget Limits Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="h-5 w-5 mr-2" />
            Budget Limits
          </CardTitle>
          <CardDescription>
            Set spending limits to control your automated gifting expenses
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="default-budget">Default Gift Budget</Label>
              <Input
                id="default-budget"
                type="number"
                value={defaultBudget}
                onChange={(e) => setDefaultBudget(parseFloat(e.target.value) || 0)}
                placeholder="50.00"
                min="1"
                step="0.01"
              />
              <p className="text-xs text-muted-foreground">
                Default budget for new auto-gifting rules
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="monthly-limit">Monthly Limit</Label>
              <Input
                id="monthly-limit"
                type="number"
                value={monthlyLimit}
                onChange={(e) => setMonthlyLimit(e.target.value)}
                placeholder="500.00"
                min="0"
                step="0.01"
              />
              <p className="text-xs text-muted-foreground">
                Maximum to spend per month (optional)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="annual-limit">Annual Limit</Label>
              <Input
                id="annual-limit"
                type="number"
                value={annualLimit}
                onChange={(e) => setAnnualLimit(e.target.value)}
                placeholder="2000.00"
                min="0"
                step="0.01"
              />
              <p className="text-xs text-muted-foreground">
                Maximum to spend per year (optional)
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave}>
              Save Budget Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BudgetTrackingSection;
