import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Bot, Calendar, Clock, Gift, Package, Settings, 
  CheckCircle, AlertCircle, Pause, Play, Edit, Trash2 
} from "lucide-react";
import { format } from "date-fns";
import { useAutoGifting } from "@/hooks/useAutoGifting";
import { useAuth } from "@/contexts/auth";

interface MyGiftsDashboardProps {
  onEditRule?: (ruleId: string) => void;
  onScheduleGift?: () => void;
}

export const MyGiftsDashboard: React.FC<MyGiftsDashboardProps> = ({
  onEditRule,
  onScheduleGift
}) => {
  const { user } = useAuth();
  const { rules, loading } = useAutoGifting();
  const [selectedTab, setSelectedTab] = useState("overview");

  const activeRules = rules?.filter(rule => rule.is_active) || [];
  const scheduledGifts = []; // TODO: Integrate with actual scheduled gifts data
  const giftHistory = []; // TODO: Integrate with actual gift history

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-100 text-emerald-700';
      case 'paused': return 'bg-yellow-100 text-yellow-700';
      case 'scheduled': return 'bg-blue-100 text-blue-700';
      case 'completed': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Bot className="h-4 w-4" />;
      case 'paused': return <Pause className="h-4 w-4" />;
      case 'scheduled': return <Clock className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your gifts...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-primary">{activeRules.length}</p>
                <p className="text-sm text-muted-foreground">AI Rules Active</p>
              </div>
              <Bot className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-primary">{scheduledGifts.length}</p>
                <p className="text-sm text-muted-foreground">Scheduled Gifts</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-primary">{giftHistory.length}</p>
                <p className="text-sm text-muted-foreground">Gifts Sent</p>
              </div>
              <Gift className="h-8 w-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="ai-rules">AI Rules</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Active AI Rules Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-purple-500" />
                  AI Auto-Gifting
                </CardTitle>
                <CardDescription>
                  Your active automation rules
                </CardDescription>
              </CardHeader>
              <CardContent>
                {activeRules.length > 0 ? (
                  <div className="space-y-3">
                    {activeRules.slice(0, 3).map((rule) => (
                      <div key={rule.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{rule.date_type}</p>
                          <p className="text-sm text-muted-foreground">
                            Budget: ${rule.budget_limit}
                          </p>
                        </div>
                        <Badge className={getStatusColor('active')}>
                          {getStatusIcon('active')}
                          <span className="ml-1">Active</span>
                        </Badge>
                      </div>
                    ))}
                    {activeRules.length > 3 && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setSelectedTab('ai-rules')}
                        className="w-full"
                      >
                        View all {activeRules.length} rules
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground mb-4">No AI rules set up yet</p>
                    <Button size="sm">Create Auto-Gift Rule</Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Upcoming Scheduled Gifts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-500" />
                  Upcoming Gifts
                </CardTitle>
                <CardDescription>
                  Manually scheduled deliveries
                </CardDescription>
              </CardHeader>
              <CardContent>
                {scheduledGifts.length > 0 ? (
                  <div className="space-y-3">
                    {/* TODO: Map scheduled gifts */}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground mb-4">No scheduled gifts</p>
                    <Button size="sm" variant="outline" onClick={onScheduleGift}>
                      Schedule a Gift
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="ai-rules" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">AI Auto-Gifting Rules</h3>
              <p className="text-sm text-muted-foreground">
                Manage your automated gift-giving rules
              </p>
            </div>
            <Button size="sm">
              <Bot className="h-4 w-4 mr-2" />
              New Rule
            </Button>
          </div>

          {activeRules.length > 0 ? (
            <div className="grid gap-4">
              {activeRules.map((rule) => (
                <Card key={rule.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-purple-100">
                          <Bot className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <h4 className="font-medium">{rule.date_type}</h4>
                          <p className="text-sm text-muted-foreground">
                            Budget: ${rule.budget_limit} • 
                            Source: {rule.gift_selection_criteria?.source || 'Wishlist'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor('active')}>
                          {getStatusIcon('active')}
                          <span className="ml-1">Active</span>
                        </Badge>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => onEditRule?.(rule.id)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Bot className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No AI Rules Yet</h3>
                <p className="text-muted-foreground mb-6">
                  Set up auto-gifting rules to let AI handle your gift-giving
                </p>
                <Button>
                  <Bot className="h-4 w-4 mr-2" />
                  Schedule Your First Gift
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Scheduled Gifts</h3>
              <p className="text-sm text-muted-foreground">
                Manually scheduled gift deliveries
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={onScheduleGift}>
              <Calendar className="h-4 w-4 mr-2" />
              Schedule Gift
            </Button>
          </div>

          <Card>
            <CardContent className="text-center py-12">
              <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No Scheduled Gifts</h3>
              <p className="text-muted-foreground mb-6">
                Schedule gifts during checkout or from your cart
              </p>
              <Button variant="outline" onClick={onScheduleGift}>
                <Calendar className="h-4 w-4 mr-2" />
                Schedule a Gift
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Gift History</h3>
            <p className="text-sm text-muted-foreground">
              All gifts you've sent through Elyphant
            </p>
          </div>

          <Card>
            <CardContent className="text-center py-12">
              <Gift className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No Gift History</h3>
              <p className="text-muted-foreground mb-6">
                Your sent gifts will appear here
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};