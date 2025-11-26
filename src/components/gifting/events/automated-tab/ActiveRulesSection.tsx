
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Trash2, DollarSign, Bell, Gift, Pencil } from "lucide-react";
import { UnifiedGiftRule, unifiedGiftManagementService } from "@/services/UnifiedGiftManagementService";
import { useAutoGifting } from "@/hooks/useAutoGifting";
import { toast } from "sonner";
import { getOccasionDisplayName, getRecipientDisplayName, getSourceDisplayName, formatBudgetDisplay } from "@/utils/autoGiftDisplayHelpers";

interface ActiveRulesSectionProps {
  rules: UnifiedGiftRule[];
  onEditRule?: (rule: UnifiedGiftRule) => void;
}

const ActiveRulesSection = ({ rules, onEditRule }: ActiveRulesSectionProps) => {
  const { updateRule, deleteRule } = useAutoGifting();

  const handleToggleRule = async (ruleId: string, isActive: boolean) => {
    await updateRule(ruleId, { is_active: isActive });
  };

  const handleDeleteRule = async (ruleId: string) => {
    try {
      // Check for pending executions that will be cancelled
      const cancellationCheck = await unifiedGiftManagementService.canCancelRule(ruleId);
      
      // Build confirmation message
      const executionInfo = Object.entries(cancellationCheck.executions)
        .filter(([key, count]) => count > 0 && (key === 'pending' || key === 'processing'))
        .map(([key, count]) => `${count} ${key} gift${count !== 1 ? 's' : ''}`)
        .join(', ');

      const message = executionInfo 
        ? `Delete this AI Gifting rule?\n\nThis will also cancel: ${executionInfo}\n\nThis action cannot be undone.`
        : "Delete this AI Gifting rule? This action cannot be undone.";

      const confirmed = confirm(message);
      if (!confirmed) return;

      // If there are pending executions, cancel them first
      if (executionInfo) {
        const cancelResult = await unifiedGiftManagementService.cancelAutoGiftRule(ruleId, "Rule deleted by user");
        if (!cancelResult.success) {
          toast.error(`Failed to cancel pending gifts: ${cancelResult.message}`);
          return;
        }
        if (cancelResult.cancelledExecutions > 0) {
          toast.success(`Cancelled ${cancelResult.cancelledExecutions} pending gift${cancelResult.cancelledExecutions !== 1 ? 's' : ''}`);
        }
      }

      // Now delete the rule
      await deleteRule(ruleId);
      toast.success('AI Gifting rule deleted successfully');
    } catch (error) {
      console.error('Error deleting rule:', error);
      toast.error('Failed to delete AI Gifting rule');
    }
  };

  if (rules.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No active rules</h3>
            <p className="text-muted-foreground text-sm">
              Create events with auto-gifting enabled to see them here
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium">Active Auto-Gifting Rules</h3>
        <p className="text-sm text-muted-foreground">
          Manage your automated gift-giving rules
        </p>
      </div>

      <div className="space-y-3">
        {rules.map((rule) => (
          <Card key={rule.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-base">{getOccasionDisplayName(rule.date_type)}</CardTitle>
                  <CardDescription>
                    For {getRecipientDisplayName(rule)}
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={rule.is_active}
                    onCheckedChange={(checked) => handleToggleRule(rule.id, checked)}
                  />
                  <Badge variant={rule.is_active ? "default" : "secondary"}>
                    {rule.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span>{formatBudgetDisplay(rule.budget_limit)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Gift className="h-4 w-4 text-muted-foreground" />
                    <span>Source: {getSourceDisplayName(rule.gift_selection_criteria?.source)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Bell className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {rule.notification_preferences?.days_before?.length 
                        ? `${rule.notification_preferences.days_before.join(", ")} days before`
                        : "No reminders"}
                    </span>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  {onEditRule && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => onEditRule(rule)}
                      className="min-h-[44px]"
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleDeleteRule(rule.id)}
                    className="text-destructive hover:text-destructive min-h-[44px]"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ActiveRulesSection;
