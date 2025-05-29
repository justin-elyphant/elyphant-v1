
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Settings, Trash2, DollarSign, Bell, Gift } from "lucide-react";
import { AutoGiftingRule } from "@/services/autoGiftingService";
import { useAutoGifting } from "@/hooks/useAutoGifting";

interface ActiveRulesSectionProps {
  rules: AutoGiftingRule[];
}

const ActiveRulesSection = ({ rules }: ActiveRulesSectionProps) => {
  const { updateRule, deleteRule } = useAutoGifting();

  const handleToggleRule = async (ruleId: string, isActive: boolean) => {
    await updateRule(ruleId, { is_active: isActive });
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (confirm("Are you sure you want to delete this auto-gifting rule?")) {
      await deleteRule(ruleId);
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
                  <CardTitle className="text-base">{rule.date_type}</CardTitle>
                  <CardDescription>
                    Recipient ID: {rule.recipient_id}
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
                    <span>Budget: ${rule.budget_limit || 0}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Gift className="h-4 w-4 text-muted-foreground" />
                    <span>Source: {rule.gift_selection_criteria?.source || "wishlist"}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Bell className="h-4 w-4 text-muted-foreground" />
                    <span>
                      Reminders: {rule.notification_preferences?.days_before?.join(", ") || "None"} days before
                    </span>
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleDeleteRule(rule.id)}
                    className="text-destructive hover:text-destructive"
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
