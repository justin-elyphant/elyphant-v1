import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Gift, Settings, Trash2, ChevronDown, Mail, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { BudgetEditor } from "./BudgetEditor";
import {
  getOccasionDisplayName,
  getRecurrenceDescription,
  getSourceDisplayName,
} from "@/utils/autoGiftDisplayHelpers";

interface RecipientGiftCardProps {
  recipientName: string;
  recipientId?: string;
  recipientEmail?: string;
  recipientProfileImage?: string;
  isPending: boolean;
  rules: Array<any>;
  totalBudget: number;
  onEditRule: (ruleId: string) => void;
  onToggleRule: (ruleId: string, isActive: boolean) => void;
  onDeleteRule: (ruleId: string) => void;
  onBudgetUpdate: (ruleId: string, newBudget: number) => Promise<void>;
}

const OccasionRow: React.FC<{
  rule: any;
  recipientName: string;
  isPending: boolean;
  onEditRule: (ruleId: string) => void;
  onToggleRule: (ruleId: string, isActive: boolean) => void;
  onDeleteRule: (ruleId: string) => void;
  onBudgetUpdate: (ruleId: string, newBudget: number) => Promise<void>;
}> = ({ rule, recipientName, isPending, onEditRule, onToggleRule, onDeleteRule, onBudgetUpdate }) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="border rounded-lg p-3 hover:bg-accent/50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex-shrink-0">
            <Gift className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium truncate">
                {getOccasionDisplayName(rule.date_type)}
              </span>
              {isPending && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" className="text-xs text-yellow-600 border-yellow-300 bg-yellow-50 shrink-0 flex items-center gap-1 px-1.5 py-0">
                        <Mail className="h-2.5 w-2.5" />
                        <Info className="h-2.5 w-2.5" />
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>
                        Gift will be sent on the occasion date even if {recipientName} hasn't joined yet.
                        We'll use smart AI selection.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              ${rule.budget_limit || 50} • {getRecurrenceDescription(rule)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Switch
            checked={rule.is_active}
            onCheckedChange={(checked) => onToggleRule(rule.id, checked)}
            className="scale-75"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className="h-8 w-8 p-0"
          >
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform",
                showDetails && "rotate-180"
              )}
            />
          </Button>
        </div>
      </div>

      {/* Expandable Details */}
      {showDetails && (
        <div className="mt-3 pt-3 border-t space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <BudgetEditor
              ruleId={rule.id}
              currentBudget={rule.budget_limit || 50}
              onSave={onBudgetUpdate}
            />
            <span className="text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground">
              {getSourceDisplayName(rule.gift_selection_criteria?.source)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEditRule(rule.id)}
              className="text-xs h-8"
            >
              <Settings className="h-3 w-3 mr-1" />
              Advanced Settings
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDeleteRule(rule.id)}
              className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 h-8"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Remove
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export const RecipientGiftCard: React.FC<RecipientGiftCardProps> = ({
  recipientName,
  recipientProfileImage,
  isPending,
  rules,
  totalBudget,
  onEditRule,
  onToggleRule,
  onDeleteRule,
  onBudgetUpdate,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  const displayedRules = isExpanded ? rules : rules.slice(0, 3);
  const hasMore = rules.length > 3;

  return (
    <Collapsible open={!isCollapsed} onOpenChange={(open) => setIsCollapsed(!open)}>
      <div className="mobile-card p-4 border rounded-lg hover:border-purple-300 transition-colors">
        {/* Recipient Header */}
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between mb-4 cursor-pointer group">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Avatar className="h-10 w-10 shrink-0">
                {recipientProfileImage && (
                  <AvatarImage src={recipientProfileImage} alt={recipientName} />
                )}
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {recipientName[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-base truncate">{recipientName}</h4>
                <p className="text-xs text-muted-foreground">
                  {rules.length} occasion{rules.length !== 1 ? "s" : ""} • $
                  {totalBudget}/year
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {isPending && (
                <Badge
                  variant="outline"
                  className="text-xs text-yellow-600 border-yellow-300 bg-yellow-50"
                >
                  <Mail className="h-3 w-3 mr-1" />
                  Pending
                </Badge>
              )}
              <ChevronDown
                className={cn(
                  "h-5 w-5 text-muted-foreground transition-transform group-hover:text-foreground",
                  !isCollapsed && "rotate-180"
                )}
              />
            </div>
          </div>
        </CollapsibleTrigger>

        {/* Occasions List */}
        <CollapsibleContent>
          <div className="space-y-2 mt-2">
            {displayedRules.map((rule) => (
              <OccasionRow
                key={rule.id}
                rule={rule}
                recipientName={recipientName}
                isPending={isPending}
                onEditRule={onEditRule}
                onToggleRule={onToggleRule}
                onDeleteRule={onDeleteRule}
                onBudgetUpdate={onBudgetUpdate}
              />
            ))}
          </div>

          {/* Expand/Collapse */}
          {hasMore && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full mt-3 text-xs h-8"
            >
              {isExpanded
                ? "Show Less"
                : `Show ${rules.length - 3} More Occasion${rules.length - 3 !== 1 ? "s" : ""}`}
            </Button>
          )}
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};
