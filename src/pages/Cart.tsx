
import React from "react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/auth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { ShoppingCart, Plus, Minus, Trash2, CreditCard, Gift, User, AlertCircle } from "lucide-react";
import Header from "@/components/home/Header";
import Footer from "@/components/home/Footer";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { useConnections } from "@/hooks/useConnections";
import ConnectionDropdown from "@/components/marketplace/product-item/ConnectionDropdown";

const Cart = () => {
  const { cartItems, cartTotal, cartGroups, updateQuantity, removeFromCart, assignToConnection, updateGiftMessage, getItemCount } = useCart();
  const { user } = useAuth();
  const { friends } = useConnections();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const itemCount = getItemCount();

  const handleCheckout = () => {
    navigate("/checkout");
  };

  const formatPrice = (price: number) => `$${price.toFixed(2)}`;

  const getConnectionName = (connectionId: string | null) => {
    if (!connectionId) return "Myself";
    const connection = friends.find(c => c.id === connectionId);
    return connection?.name || "Connection";
  };

  const getConnectionShippingStatus = (connectionId: string | null) => {
    if (!connectionId) return true; // Self shipping is always available
    const connection = friends.find(c => c.id === connectionId);
    return connection?.dataStatus?.shipping === 'verified';
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <ShoppingCart className="h-16 w-16 text-muted-foreground" />
            <h1 className="text-2xl font-bold">Your cart is empty</h1>
            <p className="text-muted-foreground">Add some products to get started</p>
            <Button onClick={() => navigate('/marketplace')} className="mt-4">
              Start Shopping
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShoppingCart className="h-6 w-6" />
            Shopping Cart
            <Badge variant="secondary">
              {itemCount} {itemCount === 1 ? 'item' : 'items'}
            </Badge>
          </h1>
        </div>

        <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'lg:grid-cols-3'}`}>
          {/* Cart Items Grouped by Connection */}
          <div className={isMobile ? 'order-1' : 'lg:col-span-2'}>
            <div className="space-y-6">
              {cartGroups.map((group) => {
                const connectionName = getConnectionName(group.connectionId);
                const hasValidShipping = getConnectionShippingStatus(group.connectionId);
                const isGift = group.connectionId !== null;

                return (
                  <Card key={group.connectionId || 'self'}>
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        {isGift ? (
                          <Gift className="h-5 w-5 text-primary" />
                        ) : (
                          <User className="h-5 w-5 text-muted-foreground" />
                        )}
                        {connectionName}
                        {isGift && !hasValidShipping && (
                          <Badge variant="destructive" className="ml-2 text-xs">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Missing Address
                          </Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Items in this group */}
                      {group.items.map((item) => (
                        <div key={item.product.product_id} className="flex gap-4 p-3 border rounded-lg">
                          <div className="flex-shrink-0">
                            <img 
                              src={item.product.image || "/placeholder.svg"} 
                              alt={item.product.name || item.product.title}
                              className="w-16 h-16 object-cover rounded-md bg-gray-100"
                            />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-base mb-1">
                              {item.product.name || item.product.title}
                            </h3>
                            <p className="text-lg font-semibold text-green-600 mb-2">
                              {formatPrice(item.product.price)}
                            </p>
                            
                            {/* Connection Assignment Dropdown */}
                            <div className="mb-3">
                              <ConnectionDropdown
                                productId={item.product.product_id}
                                currentConnectionId={item.assignedConnectionId}
                                onAssign={(connectionId) => assignToConnection(item.product.product_id, connectionId)}
                              />
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center border rounded">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => updateQuantity(item.product.product_id, item.quantity - 1)}
                                  disabled={item.quantity <= 1}
                                  className="h-10 w-10 p-0"
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                                <span className="px-4 text-base font-medium min-w-[3rem] text-center">
                                  {item.quantity}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => updateQuantity(item.product.product_id, item.quantity + 1)}
                                  disabled={item.quantity >= 10}
                                  className="h-10 w-10 p-0"
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFromCart(item.product.product_id)}
                                className="text-red-500 hover:text-red-700 p-2"
                              >
                                <Trash2 className="h-5 w-5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Gift Message for this group */}
                      {isGift && (
                        <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                          <label className="block text-sm font-medium mb-2">
                            Gift Message (Optional)
                          </label>
                          <Textarea
                            placeholder="Add a personal message for this gift..."
                            value={group.giftMessage || ''}
                            onChange={(e) => updateGiftMessage(group.connectionId, e.target.value)}
                            className="min-h-[60px]"
                          />
                        </div>
                      )}

                      {/* Warning for missing shipping */}
                      {isGift && !hasValidShipping && (
                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-yellow-600" />
                            <span className="text-sm font-medium text-yellow-800">
                              Shipping address needed
                            </span>
                          </div>
                          <p className="text-sm text-yellow-700 mt-1">
                            This connection needs to provide their shipping address before you can complete checkout.
                          </p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mt-2"
                            onClick={() => navigate('/connections')}
                          >
                            Manage Connections
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Order Summary */}
          <div className={isMobile ? 'order-2' : 'lg:col-span-1'}>
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Total */}
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Total:</span>
                  <span className="text-green-600">{formatPrice(cartTotal)}</span>
                </div>

                <Separator />

                {/* Checkout Button */}
                <Button 
                  onClick={handleCheckout}
                  className="w-full"
                  size="lg"
                  disabled={cartItems.length === 0}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Proceed to Checkout
                </Button>

                {/* Connection Status Summary */}
                <div className="text-sm text-muted-foreground space-y-1">
                  {cartGroups.map(group => {
                    const connectionName = getConnectionName(group.connectionId);
                    const hasValidShipping = getConnectionShippingStatus(group.connectionId);
                    const isGift = group.connectionId !== null;
                    
                    return (
                      <div key={group.connectionId || 'self'} className="flex items-center justify-between">
                        <span>{connectionName}</span>
                        <div className="flex items-center gap-1">
                          {isGift ? (
                            hasValidShipping ? (
                              <Badge variant="default" className="text-xs">Ready</Badge>
                            ) : (
                              <Badge variant="destructive" className="text-xs">Address Needed</Badge>
                            )
                          ) : (
                            <Badge variant="secondary" className="text-xs">Self</Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Cart;
