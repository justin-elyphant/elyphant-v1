import React, { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Gift } from "lucide-react";
import { UnifiedGiftRule, unifiedGiftManagementService } from "@/services/UnifiedGiftManagementService";
import { useAutoGifting } from "@/hooks/useAutoGifting";
import { toast } from "sonner";
import { RecipientGiftCard } from "./RecipientGiftCard";
import {
  getRecipientDisplayName,
  isPendingInvitation,
} from "@/utils/autoGiftDisplayHelpers";

interface GroupedRulesSectionProps {
  rules: UnifiedGiftRule[];
  title?: string;
  description?: string;
  showEmptyState?: boolean;
  onEditRule?: (ruleId: string) => void;
  /** If true, only show active rules */
  activeOnly?: boolean;
}

interface GroupedRecipient {
  recipientKey: string;
  recipientName: string;
  recipientProfileImage?: string;
  isPending: boolean;
  recipientEmail?: string;
  recipientId?: string | null;
  rules: UnifiedGiftRule[];
  totalBudget: number;
}

export const GroupedRulesSection: React.FC<GroupedRulesSectionProps> = ({
  rules,
  title = "Active Recurring Gift Rules",
  description = "Manage your recurring gift rules",
  showEmptyState = true,
  onEditRule,
  activeOnly = false,
}) => {
  const { updateRule, deleteRule, refreshData } = useAutoGifting();

  // Group rules by recipient
  const groupedRules = useMemo((): GroupedRecipient[] => {
    const filteredRules = activeOnly ? rules.filter(rule => rule.is_active) : rules;
    const groups = new Map<string, UnifiedGiftRule[]>();

    filteredRules.forEach((rule) => {
      const recipientKey = rule.recipient_id || rule.pending_recipient_email || "unknown";
      if (!groups.has(recipientKey)) {
        groups.set(recipientKey, []);
      }
      groups.get(recipientKey)!.push(rule);
    });

    return Array.from(groups.entries()).map(([key, recipientRules]) => ({
      recipientKey: key,
      recipientName: getRecipientDisplayName(recipientRules[0]),
      recipientProfileImage: recipientRules[0].recipient?.profile_image,
      isPending: isPendingInvitation(recipientRules[0]),
      recipientEmail: recipientRules[0].pending_recipient_email,
      recipientId: recipientRules[0].recipient_id,
      rules: recipientRules,
      totalBudget: recipientRules.reduce((sum, r) => sum + (r.budget_limit || 50), 0),
    }));
  }, [rules, activeOnly]);

  const handleToggleRule = async (ruleId: string, isActive: boolean) => {
    try {
      await updateRule(ruleId, { is_active: isActive });
      toast.success(isActive ? "Recurring gift enabled" : "Recurring gift paused");
    } catch (error) {
      toast.error("Failed to update. Please try again.");
    }
  };

  const handleBudgetUpdate = async (ruleId: string, newBudget: number) => {
    try {
      await updateRule(ruleId, { budget_limit: newBudget });
      toast.success(`Budget updated to $${newBudget}`);
      refreshData();
    } catch (error) {
      toast.error("Failed to update budget. Please try again.");
      throw error;
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    try {
      // Check for pending executions that will be cancelled
      const cancellationCheck = await unifiedGiftManagementService.canCancelRule(ruleId);

      // Build confirmation message
      const executionInfo = Object.entries(cancellationCheck.executions)
        .filter(([key, count]) => count > 0 && (key === "pending" || key === "processing"))
        .map(([key, count]) => `${count} ${key} gift${count !== 1 ? "s" : ""}`)
        .join(", ");

      const message = executionInfo
        ? `Remove this recurring gift?\n\nThis will also cancel: ${executionInfo}\n\nThis action cannot be undone.`
        : "Remove this recurring gift? You can always set it up again later.";

      const confirmed = confirm(message);
      if (!confirmed) return;

      // If there are pending executions, cancel them first
      if (executionInfo) {
        const cancelResult = await unifiedGiftManagementService.cancelAutoGiftRule(
          ruleId,
          "Rule deleted by user"
        );
        if (!cancelResult.success) {
          toast.error(`Failed to cancel pending gifts: ${cancelResult.message}`);
          return;
        }
        if (cancelResult.cancelledExecutions > 0) {
          toast.success(
            `Cancelled ${cancelResult.cancelledExecutions} pending gift${
              cancelResult.cancelledExecutions !== 1 ? "s" : ""
            }`
          );
        }
      }

      // Now delete the rule
      await deleteRule(ruleId);
      toast.success("Recurring gift removed");
      refreshData();
    } catch (error) {
      console.error("Error deleting rule:", error);
      toast.error("Failed to remove recurring gift");
    }
  };

  if (groupedRules.length === 0 && showEmptyState) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No recurring gifts yet</h3>
            <p className="text-muted-foreground text-sm">
              Create events with recurring gifts enabled to see them here
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (groupedRules.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {(title || description) && (
        <div>
          {title && <h3 className="text-lg font-medium">{title}</h3>}
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
      )}

      <div className="space-y-3">
        {groupedRules.map((group) => (
          <RecipientGiftCard
            key={group.recipientKey}
            recipientName={group.recipientName}
            recipientId={group.recipientId || undefined}
            recipientEmail={group.recipientEmail}
            recipientProfileImage={group.recipientProfileImage}
            isPending={group.isPending}
            rules={group.rules}
            totalBudget={group.totalBudget}
            onEditRule={onEditRule || (() => {})}
            onToggleRule={handleToggleRule}
            onDeleteRule={handleDeleteRule}
            onBudgetUpdate={handleBudgetUpdate}
          />
        ))}
      </div>
    </div>
  );
};

export default GroupedRulesSection;
