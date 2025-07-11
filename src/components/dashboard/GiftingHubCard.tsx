import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Gift, Calendar, Heart, Package, Zap, Search, Plus, Eye, Clock, Bot, Users, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";

// Import existing hooks and components
import { useAuth } from "@/contexts/auth";
import { useUnifiedWishlist } from "@/hooks/useUnifiedWishlist";
import { EventsProvider, useEvents } from "@/components/gifting/events/context/EventsContext";
import { getUserOrders, Order } from "@/services/orderService";
import AutoGiftSetupDialog from "@/components/gifting/events/setup-dialog/AutoGiftSetupDialog";
import ProductDetailsDialog from "@/components/marketplace/ProductDetailsDialog";

// Import group components
import ActiveGroupProjectsWidget from "./ActiveGroupProjectsWidget";
import GroupGiftAnalytics from "./GroupGiftAnalytics";

// Smart Gifting Tab Component
const SmartGiftingTab = () => {
  const { events, isLoading: eventsLoading } = useEvents();
  const { user } = useAuth();
  const [setupDialogOpen, setSetupDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  const upcomingEvents = React.useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const eventsWithDays = events
      .filter(event => {
        if (!event.dateObj) return false;
        return event.dateObj >= today;
      })
      .map(event => {
        const daysAway = Math.ceil((event.dateObj!.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return {
          ...event,
          daysAway,
          urgency: daysAway <= 7 ? 'high' : daysAway <= 30 ? 'medium' : 'low'
        };
      })
      .sort((a, b) => {
        if (!a.dateObj || !b.dateObj) return 0;
        return a.dateObj.getTime() - b.dateObj.getTime();
      });
    
    return eventsWithDays.slice(0, 4);
  }, [events]);

  const handleSetupAutoGift = (event: any) => {
    setSelectedEvent(event);
    setSetupDialogOpen(true);
  };

  const handleSaveAutoGiftSettings = (settings: any) => {
    console.log('Auto-gift settings saved for event:', selectedEvent?.id, settings);
  };

  if (eventsLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-4 border rounded-lg animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-2" />
              <div className="h-3 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Auto-Gift Hub Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            <Zap className="h-5 w-5 mr-2 text-emerald-500" />
            Upcoming Events
          </h3>
          <div className="flex gap-2">
            <Button variant="default" size="sm" asChild>
              <Link to="/events?action=add">Add Event</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to="/events?tab=monitoring">Manage All</Link>
            </Button>
          </div>
        </div>
        
        {upcomingEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingEvents.map((event) => (
              <div key={event.id} className="p-4 border rounded-lg bg-white dark:bg-gray-800">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                      {event.type.toLowerCase().includes("birthday") ? (
                        <Gift className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      ) : (
                        <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold">{event.person}</h4>
                      <p className="text-sm text-muted-foreground">{event.type}</p>
                    </div>
                  </div>
                  
                  {event.daysAway <= 7 && (
                    <Badge variant="outline" className="text-orange-600">
                      <Clock className="h-3 w-3 mr-1" />
                      {event.daysAway === 0 ? 'Today' : 
                        event.daysAway === 1 ? 'Tomorrow' : 
                        `${event.daysAway} days`}
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {event.dateObj ? format(event.dateObj, 'MMM d, yyyy') : event.date}
                  </p>
                  <Button 
                    size="sm" 
                    variant={event.autoGiftEnabled ? "outline" : "default"}
                    onClick={() => handleSetupAutoGift(event)}
                  >
                    {event.autoGiftEnabled ? "Manage" : "Set Up"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 border rounded-lg bg-gray-50 dark:bg-gray-800">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h4 className="font-medium mb-2">No upcoming events</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Add special occasions to set up automated gifting
            </p>
            <Button asChild>
              <Link to="/events?action=add">Add Event</Link>
            </Button>
          </div>
        )}
      </div>

      {/* Nicole AI Quick Access */}
      <div className="p-6 border rounded-lg bg-gradient-to-r from-purple-100 via-blue-100 to-cyan-100 dark:from-purple-900/30 dark:via-blue-900/30 dark:to-cyan-900/30 shadow-lg relative overflow-hidden">
        {/* Subtle animated background effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-blue-500/5 to-cyan-500/5 animate-pulse"></div>
        
        <div className="flex items-center justify-between relative z-10">
          <div>
            <h4 className="font-semibold flex items-center">
              <Bot className="h-5 w-5 mr-2 text-purple-600 dark:text-purple-400" />
              <span className="bg-gradient-to-r from-purple-700 to-cyan-700 bg-clip-text text-transparent">
                Need Gift Ideas?
              </span>
            </h4>
            <p className="text-sm text-muted-foreground mt-1">Ask Nicole for personalized AI recommendations</p>
          </div>
          <Button asChild className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white border-0 shadow-md">
            <Link to="/marketplace?mode=nicole&open=true&greeting=dashboard">
              Ask Nicole
            </Link>
          </Button>
        </div>
      </div>

      {/* Auto-Gift Setup Dialog */}
      {selectedEvent && (
        <AutoGiftSetupDialog
          open={setupDialogOpen}
          onOpenChange={setSetupDialogOpen}
          eventId={selectedEvent.id}
          eventType={selectedEvent.type}
          recipientId={selectedEvent.recipientId}
          onSave={handleSaveAutoGiftSettings}
        />
      )}
    </div>
  );
};

// My Collections Tab Component
const MyCollectionsTab = () => {
  const { wishlists, loading } = useUnifiedWishlist();
  const { user } = useAuth();
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showProductDetails, setShowProductDetails] = useState(false);

  const { totalItems, wishlistCount, allItems } = React.useMemo(() => {
    const totalItems = wishlists?.reduce((total, wishlist) => total + (wishlist.items?.length || 0), 0) || 0;
    const wishlistCount = wishlists?.length || 0;

    const allItems = wishlists?.flatMap(wishlist => 
      (wishlist.items || []).map(item => ({
        ...item,
        wishlistName: wishlist.title,
        addedDate: item.created_at ? new Date(item.created_at) : new Date()
      }))
    ) || [];
      
    return { totalItems, wishlistCount, allItems };
  }, [wishlists]);

  const handleProductClick = (item: any) => {
    const productData = {
      id: item.product_id || item.id,
      product_id: item.product_id || item.id,
      title: item.name || item.title,
      name: item.name || item.title,
      price: item.price,
      image: item.image_url,
      image_url: item.image_url,
      brand: item.brand,
      description: item.description || `${item.name || item.title} from ${item.wishlistName}`,
      vendor: item.brand
    };
    
    setSelectedProduct(productData);
    setShowProductDetails(true);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="p-4 border rounded-lg animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2" />
            <div className="h-3 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Wishlists Overview */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            <Heart className="h-5 w-5 mr-2 text-pink-500" />
            My Wishlists ({wishlistCount})
          </h3>
          <Button variant="outline" size="sm" asChild>
            <Link to="/wishlists">Manage All</Link>
          </Button>
        </div>

        {wishlistCount > 0 ? (
          <div className="space-y-4">
            {/* Wishlist Folders */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {wishlists.slice(0, 4).map((wishlist) => (
                <div key={wishlist.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{wishlist.title}</h4>
                    <Badge variant="outline">{wishlist.items?.length || 0} items</Badge>
                  </div>
                  {wishlist.description && (
                    <p className="text-sm text-muted-foreground mb-3">{wishlist.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    {wishlist.category && (
                      <Badge variant="secondary" className="text-xs">{wishlist.category}</Badge>
                    )}
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/wishlist/${wishlist.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Recent Items */}
            {totalItems > 0 && (
              <div>
                <h4 className="font-medium mb-3">Recent Items</h4>
                <ScrollArea className="h-64">
                  <div className="space-y-2 pr-4">
                    {allItems.slice(0, 8).map((item, index) => (
                      <div 
                        key={`${item.id}-${index}`} 
                        className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                        onClick={() => handleProductClick(item)}
                      >
                        {item.image_url && (
                          <img 
                            src={item.image_url} 
                            alt={item.name || item.title} 
                            className="w-10 h-10 rounded object-cover flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.name || item.title}</p>
                          <p className="text-xs text-muted-foreground">{item.wishlistName}</p>
                        </div>
                        {item.price && (
                          <p className="text-sm font-medium">${item.price}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 border rounded-lg bg-gray-50 dark:bg-gray-800">
            <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h4 className="font-medium mb-2">Create Your First Wishlist</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Organize items you'd love to receive or give as gifts
            </p>
            <Button asChild>
              <Link to="/wishlists">
                <Plus className="h-4 w-4 mr-2" />
                Create Wishlist
              </Link>
            </Button>
          </div>
        )}
      </div>

      {/* Browse Marketplace */}
      <div className="p-4 border rounded-lg bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold flex items-center">
              <Search className="h-5 w-5 mr-2 text-emerald-500" />
              Discover New Items
            </h4>
            <p className="text-sm text-muted-foreground">Browse curated gifts and add to your wishlists</p>
          </div>
          <Button asChild>
            <Link to="/marketplace">Browse Marketplace</Link>
          </Button>
        </div>
      </div>

      {/* Product Details Dialog */}
      <ProductDetailsDialog
        product={selectedProduct}
        open={showProductDetails}
        onOpenChange={setShowProductDetails}
        userData={user}
        onWishlistChange={() => {}}
      />
    </div>
  );
};

// Gift Activity Tab Component  
const GiftActivityTab = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const userOrders = await getUserOrders();
        setOrders(userOrders.slice(0, 5)); // Show latest 5 orders
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError('Failed to load orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatPrice = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return 'text-green-600 bg-green-50';
      case 'shipped':
        return 'text-blue-600 bg-blue-50';
      case 'processing':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="p-4 border rounded-lg animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2" />
            <div className="h-3 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Recent Orders */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            <Package className="h-5 w-5 mr-2 text-blue-500" />
            Recent Orders
          </h3>
          <Button variant="outline" size="sm" asChild>
            <Link to="/orders">View All</Link>
          </Button>
        </div>

        {orders.length > 0 ? (
          <div className="space-y-3">
            {orders.map((order) => (
              <div key={order.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="font-medium">{order.order_number}</h4>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(order.created_at)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatPrice(order.total_amount)}</p>
                    <Badge className={`text-xs ${getStatusColor(order.status)}`}>
                      {order.status}
                    </Badge>
                  </div>
                </div>
                
                {order.is_gift && (
                  <div className="flex items-center gap-2 mt-2">
                    <Gift className="h-4 w-4 text-pink-500" />
                    <span className="text-sm text-pink-600">Gift Order</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 border rounded-lg bg-gray-50 dark:bg-gray-800">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h4 className="font-medium mb-2">No Recent Orders</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Your order history will appear here
            </p>
            <Button asChild>
              <Link to="/marketplace">Start Shopping</Link>
            </Button>
          </div>
        )}
      </div>

      {/* Group Projects Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center mb-4">
            <Users className="h-5 w-5 mr-2 text-blue-500" />
            <h3 className="text-lg font-semibold">Active Group Projects</h3>
          </div>
          <div className="p-6 bg-card rounded-lg border">
            <ActiveGroupProjectsWidget />
          </div>
        </div>
        
        <div>
          <div className="flex items-center mb-4">
            <Target className="h-5 w-5 mr-2 text-purple-500" />
            <h3 className="text-lg font-semibold">Group Gift Analytics</h3>
          </div>
          <div className="p-6 bg-card rounded-lg border">
            <GroupGiftAnalytics />
          </div>
        </div>
      </div>

      {/* Gift Analytics Placeholder */}
      <div className="p-4 border rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
        <div className="text-center">
          <h4 className="font-semibold mb-2">Gift Analytics</h4>
          <p className="text-sm text-muted-foreground mb-4">
            Track your gifting patterns and success rates
          </p>
          <Button variant="outline" disabled>
            Coming Soon
          </Button>
        </div>
      </div>
    </div>
  );
};

// Main Gifting Hub Card Component
const GiftingHubCard = () => {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <Card className="border-2 border-gradient-to-r from-purple-200 to-pink-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-semibold flex items-center">
          <Gift className="h-6 w-6 mr-2 text-purple-500" />
          Gifting Hub
        </CardTitle>
        <CardDescription>
          Your central hub for all things gifting - from auto-gifts to wishlists and orders
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="smart-gifting" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="smart-gifting" className="text-xs">
              <Zap className="h-4 w-4 mr-1" />
              Smart Gifting
            </TabsTrigger>
            <TabsTrigger value="collections" className="text-xs">
              <Heart className="h-4 w-4 mr-1" />
              My Collections
            </TabsTrigger>
            <TabsTrigger value="activity" className="text-xs">
              <Package className="h-4 w-4 mr-1" />
              Gift Activity
            </TabsTrigger>
          </TabsList>

          <TabsContent value="smart-gifting" className="mt-6">
            <EventsProvider>
              <SmartGiftingTab />
            </EventsProvider>
          </TabsContent>

          <TabsContent value="collections" className="mt-6">
            <MyCollectionsTab />
          </TabsContent>

          <TabsContent value="activity" className="mt-6">
            <GiftActivityTab />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default GiftingHubCard;