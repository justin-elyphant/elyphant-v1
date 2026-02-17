import React from "react";
import { formatPrice } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, Users, DollarSign, TrendingUp, AlertTriangle, CheckCircle, Percent, PiggyBank, Crown, Handshake, Settings2, RotateCcw } from "lucide-react";
import { useOrders } from "@/hooks/trunkline/useOrders";
import { useCustomers } from "@/hooks/trunkline/useCustomers";
import { useDashboardLayout } from "@/hooks/trunkline/useDashboardLayout";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { DraggableSection } from './DraggableSection';
import { DraggableCard } from './DraggableCard';

// Helper to extract gifting fee from line_items JSONB (stored in cents)
const extractGiftingFee = (lineItems: any): number => {
  if (!lineItems) return 0;
  
  if (typeof lineItems === 'object') {
    if (lineItems.gifting_fee !== undefined) {
      return Number(lineItems.gifting_fee) / 100;
    }
    if (Array.isArray(lineItems)) {
      return lineItems.reduce((sum, item) => {
        if (item?.gifting_fee !== undefined) {
          return sum + Number(item.gifting_fee) / 100;
        }
        return sum;
      }, 0);
    }
  }
  return 0;
};

// Status categories for revenue calculation
const COMPLETED_STATUSES = ['completed', 'shipped', 'delivered'];
const PENDING_STATUSES = ['scheduled', 'pending', 'processing'];
const EXCLUDED_STATUSES = ['failed', 'cancelled'];

export default function OverviewTab() {
  const { orders, loading: ordersLoading } = useOrders();
  const { customers, loading: customersLoading } = useCustomers();
  const { sections, isEditing, setIsEditing, reorderSections, reorderCards, resetLayout } = useDashboardLayout();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Filter orders by status category
  const completedOrders = orders.filter(order => COMPLETED_STATUSES.includes(order.status));
  const pendingOrders = orders.filter(order => PENDING_STATUSES.includes(order.status));
  const failedOrders = orders.filter(order => EXCLUDED_STATUSES.includes(order.status));

  // Calculate GMV (Gross Merchandise Value) - completed orders only
  const gmv = completedOrders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
  const pendingGmv = pendingOrders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);

  // Calculate Net Revenue (Elyphant Gifting Fees) - completed orders only
  const netRevenue = completedOrders.reduce((sum, order) => {
    return sum + extractGiftingFee(order.line_items);
  }, 0);
  const pendingNetRevenue = pendingOrders.reduce((sum, order) => {
    return sum + extractGiftingFee(order.line_items);
  }, 0);

  // Zinc fulfillment cost ($1.00 per order)
  const ZINC_FEE_PER_ORDER = 1.00;
  const zincCosts = completedOrders.length * ZINC_FEE_PER_ORDER;

  // Gross Profit = Net Revenue - Zinc Costs
  const grossProfit = netRevenue - zincCosts;

  // Calculate rates
  const takeRate = gmv > 0 ? (netRevenue / gmv) * 100 : 0;
  const grossMargin = netRevenue > 0 ? (grossProfit / netRevenue) * 100 : 0;

  // Total customers and orders
  const totalOrders = orders.length - failedOrders.length;
  const totalCustomers = customers.length;

  // Recent orders (last 7 days)
  const lastWeek = new Date();
  lastWeek.setDate(lastWeek.getDate() - 7);
  const recentOrders = orders.filter(order => 
    new Date(order.created_at) > lastWeek && !EXCLUDED_STATUSES.includes(order.status)
  );

  const handleSectionDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      reorderSections(active.id as string, over.id as string);
    }
  };

  const handleCardDragEnd = (sectionId: string) => (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      reorderCards(sectionId, active.id as string, over.id as string);
    }
  };

  // Card render functions
  const renderCard = (cardId: string) => {
    switch (cardId) {
      case 'net-revenue':
        return (
          <Card className="relative overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Net Revenue</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{formatPrice(netRevenue)}</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
                    <span className="text-xs text-green-600">
                      {pendingNetRevenue > 0 ? `+${formatPrice(pendingNetRevenue)} pending` : "Elyphant fees earned"}
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <DollarSign className="h-6 w-6 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      case 'gmv':
        return (
          <Card className="relative overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">GMV</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{formatPrice(gmv)}</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
                    <span className="text-xs text-green-600">
                      {pendingGmv > 0 ? `+${formatPrice(pendingGmv)} pending` : "Total order value"}
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <TrendingUp className="h-6 w-6 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      case 'gross-profit':
        return (
          <Card className="relative overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Gross Profit</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{formatPrice(grossProfit)}</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className={`h-3 w-3 mr-1 ${grossProfit > 0 ? 'text-green-600' : 'text-orange-600'}`} />
                    <span className={`text-xs ${grossProfit > 0 ? 'text-green-600' : 'text-orange-600'}`}>
                      {grossMargin.toFixed(1)}% margin
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <PiggyBank className="h-6 w-6 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      case 'take-rate':
        return (
          <Card className="relative overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Take Rate</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{takeRate.toFixed(1)}%</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className={`h-3 w-3 mr-1 ${takeRate > 0 ? 'text-green-600' : 'text-orange-600'}`} />
                    <span className={`text-xs ${takeRate > 0 ? 'text-green-600' : 'text-orange-600'}`}>
                      {completedOrders.length} fulfilled orders
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <Percent className="h-6 w-6 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      case 'total-orders':
        return (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{totalOrders}</p>
                  <span className="text-xs text-muted-foreground">+{recentOrders.length} this week</span>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <Package className="h-6 w-6 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      case 'customers':
        return (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Customers</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{totalCustomers}</p>
                  <span className="text-xs text-muted-foreground">Active users</span>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <Users className="h-6 w-6 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      case 'pending-orders':
        return (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending Orders</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{pendingOrders.length}</p>
                  <span className="text-xs text-orange-600">Needs attention</span>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      case 'order-status':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Order Status Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Completed/Shipped/Delivered</span>
                  <span className="font-medium text-green-600">{completedOrders.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Pending/Processing/Scheduled</span>
                  <span className="font-medium text-orange-600">{pendingOrders.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Failed/Cancelled</span>
                  <span className="font-medium text-red-600">{failedOrders.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      case 'revenue-breakdown':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                Revenue Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Net Revenue (Fees)</span>
                  <span className="font-medium text-green-600">{formatPrice(netRevenue)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Zinc Fulfillment Costs</span>
                  <span className="font-medium text-red-600">-{formatPrice(zincCosts)}</span>
                </div>
                <div className="flex justify-between items-center border-t pt-2">
                  <span className="text-sm font-medium text-foreground">Gross Profit</span>
                  <span className="font-bold text-foreground">{formatPrice(grossProfit)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      case 'subscription':
        return (
          <div className="p-4 rounded-lg bg-muted/30 border border-dashed">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                <Crown className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-foreground">Subscription Revenue</p>
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">Coming Soon</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Recurring revenue from Elyphant Pro/Premium memberships
            </p>
          </div>
        );
      case 'commissions':
        return (
          <div className="p-4 rounded-lg bg-muted/30 border border-dashed">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-full bg-sky-100 flex items-center justify-center">
                <Handshake className="h-5 w-5 text-sky-600" />
              </div>
              <div>
                <p className="font-medium text-foreground">Retailer Commissions</p>
                <span className="text-xs px-2 py-0.5 rounded-full bg-sky-100 text-sky-700">Coming Soon</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Earned commissions from brand partnerships
            </p>
          </div>
        );
      case 'recent-orders':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Recent Order Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {orders.slice(0, 5).map((order) => (
                  <div key={order.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="font-medium text-sm text-foreground">{order.order_number}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-sm text-foreground">${Number(order.total_amount).toFixed(2)}</p>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        COMPLETED_STATUSES.includes(order.status) ? 'bg-green-100 text-green-700' :
                        PENDING_STATUSES.includes(order.status) ? 'bg-orange-100 text-orange-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      default:
        return null;
    }
  };

  // Section render functions
  const renderSection = (section: typeof sections[0]) => {
    const gridClass = 
      section.id === 'revenue-metrics' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6' :
      section.id === 'secondary-metrics' ? 'grid grid-cols-1 md:grid-cols-3 gap-6' :
      section.id === 'quick-stats' ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' :
      section.id === 'future-revenue' ? 'grid gap-4 md:grid-cols-2' :
      '';

    if (section.id === 'future-revenue') {
      return (
        <Card className="border-dashed border-2">
          <CardHeader>
            <CardTitle className="text-muted-foreground">Future Revenue Streams</CardTitle>
          </CardHeader>
          <CardContent>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleCardDragEnd(section.id)}>
              <SortableContext items={section.cards} strategy={horizontalListSortingStrategy}>
                <div className={gridClass}>
                  {section.cards.map(cardId => (
                    <DraggableCard key={cardId} id={cardId} isEditing={isEditing}>
                      {renderCard(cardId)}
                    </DraggableCard>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </CardContent>
        </Card>
      );
    }

    if (section.id === 'recent-activity') {
      return renderCard('recent-orders');
    }

    return (
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleCardDragEnd(section.id)}>
        <SortableContext items={section.cards} strategy={horizontalListSortingStrategy}>
          <div className={gridClass}>
            {section.cards.map(cardId => (
              <DraggableCard key={cardId} id={cardId} isEditing={isEditing}>
                {renderCard(cardId)}
              </DraggableCard>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    );
  };

  if (ordersLoading || customersLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-16 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard Overview</h1>
          <p className="text-muted-foreground mt-1">Revenue metrics following marketplace accounting standards</p>
        </div>
        <div className="flex items-center gap-2">
          {isEditing && (
            <Button variant="ghost" size="sm" onClick={resetLayout}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          )}
          <Button 
            variant={isEditing ? "default" : "outline"} 
            size="sm" 
            onClick={() => setIsEditing(!isEditing)}
          >
            <Settings2 className="h-4 w-4 mr-2" />
            {isEditing ? "Done" : "Customize"}
          </Button>
        </div>
      </div>

      {isEditing && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-sm text-muted-foreground">
          Drag sections or cards to reorder. Your layout is saved automatically.
        </div>
      )}

      {/* Draggable Sections */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleSectionDragEnd}>
        <SortableContext items={sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-6">
            {sections.map(section => (
              <DraggableSection 
                key={section.id} 
                id={section.id} 
                isEditing={isEditing}
                title={section.title}
              >
                {renderSection(section)}
              </DraggableSection>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
