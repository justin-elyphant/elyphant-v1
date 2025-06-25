
import React from "react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/auth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, Plus, Minus, Trash2, CreditCard, Gift, Zap, ArrowRight } from "lucide-react";
import Header from "@/components/home/Header";
import Footer from "@/components/home/Footer";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

const Cart = () => {
  const { cartItems, cartTotal, updateQuantity, removeFromCart, getItemCount } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const itemCount = getItemCount();

  const handleExpressCheckout = (type: 'self' | 'gift') => {
    if (!user && type === 'self') {
      toast.error('Please sign in to use express checkout');
      navigate('/sign-in');
      return;
    }

    // Navigate directly to checkout with the express mode and type
    navigate('/checkout', { 
      state: { 
        expressMode: true, 
        expressType: type 
      } 
    });
    
    toast.success(`Express ${type === 'self' ? 'purchase' : 'gift'} mode activated`);
  };

  const handleRegularCheckout = () => {
    navigate("/checkout");
  };

  const formatPrice = (price: number) => `$${price.toFixed(2)}`;
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const isSingleItem = cartItems.length === 1;

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
          {/* Cart Items */}
          <div className={isMobile ? 'order-1' : 'lg:col-span-2'}>
            <div className="space-y-4">
              {cartItems.map((item) => (
                <Card key={item.product.product_id}>
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0">
                        <img 
                          src={item.product.image || "/placeholder.svg"} 
                          alt={item.product.name || item.product.title}
                          className="w-20 h-20 object-cover rounded-md bg-gray-100"
                        />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-base mb-2">
                          {item.product.name || item.product.title}
                        </h3>
                        <p className="text-lg font-semibold text-green-600 mb-4">
                          {formatPrice(item.product.price)}
                        </p>
                        
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
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Order Summary with Express Checkout */}
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

                {/* Express Checkout Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Zap className="h-4 w-4 text-yellow-500" />
                    <span className="font-medium">Express Checkout</span>
                  </div>
                  
                  <div className="space-y-3">
                    <Button
                      onClick={() => handleExpressCheckout('gift')}
                      className="w-full h-12 bg-primary hover:bg-primary/90"
                      size="lg"
                    >
                      <Gift className="h-4 w-4 mr-2" />
                      <div className="text-left flex-1">
                        <div className="font-medium">Send as Gift</div>
                        <div className="text-xs opacity-90">
                          {isSingleItem ? '1 item' : `${totalItems} items`} • Quick gift setup
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>

                    <Button
                      onClick={() => handleExpressCheckout('self')}
                      disabled={!user}
                      variant="outline"
                      className="w-full h-12"
                      size="lg"
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      <div className="text-left flex-1">
                        <div className="font-medium">Buy for Myself</div>
                        <div className="text-xs opacity-70">
                          {isSingleItem ? '1 item' : `${totalItems} items`} • Ship to me
                        </div>
                      </div>
                    </Button>
                  </div>

                  {!user && (
                    <p className="text-xs text-muted-foreground text-center">
                      Sign in to use "Buy for Myself" with saved information
                    </p>
                  )}

                  <Separator />

                  {/* Regular Checkout */}
                  <Button 
                    onClick={handleRegularCheckout}
                    variant="outline"
                    className="w-full"
                    size="default"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Standard Checkout
                  </Button>
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
