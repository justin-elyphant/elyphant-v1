
import React from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, Plus, Minus, Trash2, CreditCard } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface CartDrawerProps {
  children: React.ReactNode;
}

const CartDrawer: React.FC<CartDrawerProps> = ({ children }) => {
  const { cartItems, cartTotal, updateQuantity, removeFromCart, getItemCount } = useCart();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const itemCount = getItemCount();

  const handleCheckout = () => {
    navigate("/checkout");
  };

  const formatPrice = (price: number) => `$${price.toFixed(2)}`;

  return (
    <Sheet>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      <SheetContent 
        side="right" 
        className={cn(
          "w-full sm:max-w-lg flex flex-col h-full",
          isMobile ? "p-4" : "p-6"
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
            {itemCount === 0 ? "Your cart is empty" : "Review your items before checkout"}
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
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-4 py-4">
                {cartItems.map((item) => (
                  <div key={item.product.product_id} className="flex gap-3 p-3 border rounded-lg">
                    <div className="flex-shrink-0">
                      <img 
                        src={item.product.image || "/placeholder.svg"} 
                        alt={item.product.name || item.product.title}
                        className="w-16 h-16 object-cover rounded-md bg-gray-100"
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
                      
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center border rounded">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateQuantity(item.product.product_id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            className="h-8 w-8 p-0"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="px-2 text-sm font-medium min-w-[2rem] text-center">
                            {item.quantity}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateQuantity(item.product.product_id, item.quantity + 1)}
                            disabled={item.quantity >= 10}
                            className="h-8 w-8 p-0"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromCart(item.product.product_id)}
                          className="text-red-500 hover:text-red-700 p-1"
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
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Total:</span>
                <span className="text-lg font-bold text-green-600">
                  {formatPrice(cartTotal)}
                </span>
              </div>
              
              <Button 
                onClick={handleCheckout}
                className="w-full"
                size={isMobile ? "lg" : "default"}
                disabled={cartItems.length === 0}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Proceed to Checkout
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default CartDrawer;
