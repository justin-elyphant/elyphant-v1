import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pencil, Plus, DollarSign, Calendar } from "lucide-react";
import { UnifiedGiftRule } from "@/services/UnifiedGiftManagementService";
import { getOccasionDisplayName, formatBudgetDisplay } from "@/utils/autoGiftDisplayHelpers";

interface ExistingRulesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipientName: string;
  rules: UnifiedGiftRule[];
  onEditRule: (rule: UnifiedGiftRule) => void;
  onCreateNew: () => void;
}

const ExistingRulesDialog: React.FC<ExistingRulesDialogProps> = ({
  open,
  onOpenChange,
  recipientName,
  rules,
  onEditRule,
  onCreateNew,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto ios-smooth-scroll modal-scroll-container">
        <DialogHeader>
          <DialogTitle>AI Gifting for {recipientName}</DialogTitle>
          <DialogDescription>
            You already have {rules.length} active {rules.length === 1 ? 'rule' : 'rules'} for this person. 
            Would you like to edit an existing rule or schedule another gift?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Existing Rules */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Existing Rules</p>
            {rules.map((rule) => (
              <Card key={rule.id} className="bg-muted border-border touch-manipulation mobile-card-hover">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-sm">
                          {getOccasionDisplayName(rule.date_type)}
                        </span>
                        <Badge 
                          variant={rule.is_active ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {rule.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <DollarSign className="h-3.5 w-3.5" />
                        <span>{formatBudgetDisplay(rule.budget_limit)}</span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        onEditRule(rule);
                        onOpenChange(false);
                      }}
                      className="min-h-[44px] touch-manipulation active:scale-[0.97] transition-transform duration-75"
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Create New Rule Option */}
          <div className="pt-2">
            <Button
              onClick={() => {
                onCreateNew();
                onOpenChange(false);
              }}
              className="w-full min-h-[44px] bg-gradient-to-r from-purple-600 to-sky-500 text-white hover:opacity-90 touch-manipulation active:scale-[0.97] active:opacity-95 transition-all duration-75"
            >
              <Plus className="h-4 w-4 mr-2" />
              Schedule Another Gift for {recipientName}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExistingRulesDialog;
