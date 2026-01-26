import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Gift, Plus, Calendar, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth";
import { Link } from "react-router-dom";

interface AutoGiftRule {
  id: string;
  recipient_id: string;
  scheduled_date: string;
  is_active: boolean;
  budget_limit: number;
  profiles?: {
    name: string;
  };
}

const AutoGiftsTab = () => {
  const { user } = useAuth();
  const [rules, setRules] = useState<AutoGiftRule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    const fetchRules = async () => {
      const { data, error } = await supabase
        .from('auto_gifting_rules')
        .select('id, recipient_id, scheduled_date, is_active, budget_limit, profiles!auto_gifting_rules_recipient_id_fkey(name)')
        .eq('user_id', user.id)
        .order('scheduled_date', { ascending: true });

      if (!error && data) {
        setRules(data);
      }
      setLoading(false);
    };

    fetchRules();
  }, [user]);

  if (loading) {
    return <div className="text-muted-foreground">Loading recurring gift rules...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Recurring Gift Rules</h2>
          <p className="text-muted-foreground">Manage your recurring gifts</p>
        </div>
        <Button asChild>
          <Link to="/recurring-gifts">
            <Plus className="h-4 w-4 mr-2" />
            Create Rule
          </Link>
        </Button>
      </div>

      {rules.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <Gift className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No recurring gift rules yet</h3>
            <p className="text-muted-foreground mb-4">
              Set up recurring gifts for special occasions
            </p>
            <Button asChild>
              <Link to="/recurring-gifts">Schedule Your First Gift</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {rules.map((rule) => (
            <Card key={rule.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {rule.profiles?.name || "Unknown"}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      {new Date(rule.scheduled_date).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <Badge variant={rule.is_active ? "default" : "secondary"}>
                    {rule.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Budget: ${rule.budget_limit}
                  </span>
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/recurring-gifts`}>Manage</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AutoGiftsTab;
