
import React from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, Plus, Minus, Trash2, CreditCard, Gift, Zap } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth";
import { toast } from "sonner";
import MobileExpressCheckout from "./MobileExpressCheckout";

interface CartDrawerProps {
  children: React.ReactNode;
}

const CartDrawer: React.FC<CartDrawerProps> = ({ children }) => {
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

  const isSingleItem = cartItems.length === 1;
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Sheet>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      <SheetContent 
        side="right" 
        className={cn(
          "w-full sm:max-w-lg flex flex-col h-full prevent-bounce",
          isMobile ? "p-4 safe-area-inset" : "p-6"
        )}
      >
        <SheetHeader className="space-y-2 flex-shrink-0">
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Shopping Cart
            {itemCount > 0 && (
              <Badge variant="secondary" className="ml-auto">
                {itemCount} {itemCount === 1 ? 'item' : 'items'}
              </Badge>
            )}
          </SheetTitle>
          <SheetDescription>
            {itemCount === 0 ? "Your cart is empty" : "Review your items and choose your checkout method"}
          </SheetDescription>
        </SheetHeader>

        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 text-center">
            <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Your cart is empty</p>
            <p className="text-sm text-muted-foreground mt-1">Add some products to get started</p>
          </div>
        ) : (
          <div className="flex flex-col flex-1 min-h-0">
            <ScrollArea className="flex-1 pr-2 smooth-scroll">
              <div className="space-y-3 py-4">
                {cartItems.map((item) => (
                  <div key={item.product.product_id} className="flex gap-3 p-3 border rounded-lg touch-target-44">
                    <div className="flex-shrink-0">
                      <img 
                        src={item.product.image || "/placeholder.svg"} 
                        alt={item.product.name || item.product.title}
                        className="w-16 h-16 object-cover rounded-md bg-gray-100 will-change-transform"
                        loading="lazy"
                      />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm line-clamp-2 mb-1">
                        {item.product.name || item.product.title}
                      </h4>
                      <p className="text-sm font-semibold text-green-600">
                        {formatPrice(item.product.price)}
                      </p>
                      
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center border rounded touch-target-44">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateQuantity(item.product.product_id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            className="h-9 w-9 p-0 touch-target-44"
                            hapticFeedback="buttonTap"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="px-3 text-sm font-medium min-w-[2.5rem] text-center">
                            {item.quantity}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateQuantity(item.product.product_id, item.quantity + 1)}
                            disabled={item.quantity >= 10}
                            className="h-9 w-9 p-0 touch-target-44"
                            hapticFeedback="buttonTap"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromCart(item.product.product_id)}
                          className="text-red-500 hover:text-red-700 p-2 touch-target-44"
                          hapticFeedback="removeItem"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="flex-shrink-0 border-t pt-4 space-y-4 bg-background">
              {/* Total */}
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Total:</span>
                <span className="text-lg font-bold text-green-600">
                  {formatPrice(cartTotal)}
                </span>
              </div>

              {/* Mobile Express Checkout */}
              {isMobile ? (
                <MobileExpressCheckout
                  onCheckout={handleExpressCheckout}
                  cartTotal={cartTotal}
                  itemCount={totalItems}
                />
              ) : (
                // Desktop Express Checkout (existing design)
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Zap className="h-4 w-4 text-yellow-500" />
                    <span className="font-medium">Express Checkout</span>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-2">
                    <Button
                      onClick={() => handleExpressCheckout('gift')}
                      className="flex items-center gap-2 h-11 bg-primary hover:bg-primary/90"
                      size="default"
                    >
                      <Gift className="h-4 w-4" />
                      <div className="text-left">
                        <div className="font-medium">Send as Gift</div>
                        <div className="text-xs opacity-90">
                          {isSingleItem ? '1 item' : `${totalItems} items`} • Quick gift setup
                        </div>
                      </div>
                    </Button>

                    <Button
                      onClick={() => handleExpressCheckout('self')}
                      disabled={!user}
                      variant="outline"
                      className="flex items-center gap-2 h-11"
                      size="default"
                    >
                      <ShoppingCart className="h-4 w-4" />
                      <div className="text-left">
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
                    disabled={cartItems.length === 0}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Standard Checkout
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default CartDrawer;
