
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2, Minus, Plus, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import Header from "@/components/home/Header";
import Footer from "@/components/home/Footer";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Export the Cart component (using default export)
function Cart() {
  const { cartItems, removeFromCart, updateQuantity, clearCart, cartTotal } = useCart();
  const [showSignupDialog, setShowSignupDialog] = useState(false);
  const navigate = useNavigate();
  
  // Mock function to check if user is authenticated
  const isAuthenticated = false;
  
  const handleCheckout = () => {
    if (isAuthenticated) {
      navigate("/checkout");
    } else {
      setShowSignupDialog(true);
    }
  };
  
  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1">
          <div className="container mx-auto py-16 px-4">
            <h1 className="text-3xl font-bold mb-8">Your Cart</h1>
            <div className="text-center py-16">
              <h2 className="text-2xl font-medium mb-4">Your cart is empty</h2>
              <p className="text-muted-foreground mb-8">Add some items to your cart to get started.</p>
              <Button asChild>
                <Link to="/marketplace">Continue Shopping</Link>
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto py-8 px-4">
          <div className="flex items-center mb-8">
            <Button variant="ghost" className="mr-4" asChild>
              <Link to="/marketplace">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Continue Shopping
              </Link>
            </Button>
            <h1 className="text-3xl font-bold">Your Cart</h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card>
                <CardContent className="p-6">
                  {cartItems.map((item) => (
                    <div key={item.product.product_id} className="flex flex-col sm:flex-row gap-4 mb-6">
                      <div className="w-full sm:w-24 h-24 rounded-md overflow-hidden">
                        <img 
                          src={item.product.image} 
                          alt={item.product.name} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      <div className="flex-grow">
                        <div className="flex justify-between mb-1">
                          <h3 className="font-medium">{item.product.name}</h3>
                          <p className="font-semibold">${(item.product.price * item.quantity).toFixed(2)}</p>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{item.product.vendor}</p>
                        
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center">
                            <Button 
                              variant="outline" 
                              size="icon" 
                              className="h-8 w-8 rounded-r-none"
                              onClick={() => updateQuantity(item.product.product_id, item.quantity - 1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <div className="h-8 px-3 flex items-center justify-center border-t border-b">
                              {item.quantity}
                            </div>
                            <Button 
                              variant="outline" 
                              size="icon" 
                              className="h-8 w-8 rounded-l-none"
                              onClick={() => updateQuantity(item.product.product_id, item.quantity + 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => removeFromCart(item.product.product_id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <Separator className="my-4" />
                  
                  <div className="flex justify-between">
                    <Button variant="outline" onClick={clearCart}>
                      Clear Cart
                    </Button>
                    <Button variant="outline" asChild>
                      <Link to="/marketplace">
                        Continue Shopping
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div>
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
                  
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>${cartTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Shipping</span>
                      <span>Calculated at checkout</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tax</span>
                      <span>Calculated at checkout</span>
                    </div>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div className="flex justify-between mb-6">
                    <span className="font-semibold">Total</span>
                    <span className="font-bold">${cartTotal.toFixed(2)}</span>
                  </div>
                  
                  <Button className="w-full" onClick={handleCheckout}>
                    Proceed to Checkout
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
          
          <AlertDialog open={showSignupDialog} onOpenChange={setShowSignupDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Sign up to complete your purchase</AlertDialogTitle>
                <AlertDialogDescription>
                  You need to create an account to proceed with checkout. It only takes a minute and gives you access to order history, wishlists, and faster checkout.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Continue Shopping</AlertDialogCancel>
                <AlertDialogAction onClick={() => navigate("/signup")}>
                  Sign Up
                </AlertDialogAction>
                <Button variant="outline" onClick={() => navigate("/checkout")}>
                  Continue as Guest
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </main>
      <Footer />
    </div>
  );
}

// Export as default
export default Cart;
