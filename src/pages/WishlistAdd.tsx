import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import { useUnifiedWishlistSystem } from "@/hooks/useUnifiedWishlistSystem";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Heart, ArrowLeft } from "lucide-react";
import { formatPrice } from "@/lib/utils";

const WishlistAdd = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { quickAddToWishlist, isProductWishlisted } = useUnifiedWishlistSystem();
  const [isAdding, setIsAdding] = useState(false);
  const [productData, setProductData] = useState<any>(null);

  // Extract product data from URL parameters
  useEffect(() => {
    const productId = searchParams.get('productId');
    const title = searchParams.get('title');
    const price = searchParams.get('price');
    const source = searchParams.get('source');

    if (productId && title) {
      setProductData({
        id: productId,
        title: decodeURIComponent(title),
        price: price ? parseFloat(price) : 0,
        source: source || 'unknown'
      });
    } else {
      // Redirect to marketplace if no valid product data
      navigate('/marketplace');
    }
  }, [searchParams, navigate]);

  const handleAddToWishlist = async () => {
    if (!user) {
      toast.error("Please sign in to add items to your wishlist");
      navigate('/auth/login', { 
        state: { 
          returnUrl: window.location.pathname + window.location.search 
        }
      });
      return;
    }

    if (!productData) {
      toast.error("Product information not available");
      return;
    }

    setIsAdding(true);
    try {
      const success = await quickAddToWishlist({
        id: productData.id,
        title: productData.title,
        name: productData.title,
        price: productData.price,
        image: null // We don't have image data from email links
      });

      if (success) {
        toast.success("Added to wishlist!", {
          description: productData.title,
          action: {
            label: "View Wishlist",
            onClick: () => navigate("/wishlists")
          }
        });
        
        // Wait a moment for the toast to show, then redirect
        setTimeout(() => {
          navigate('/wishlists');
        }, 2000);
      } else {
        toast.error("Failed to add to wishlist");
      }
    } catch (error: any) {
      console.error("Error adding to wishlist:", error);
      toast.error("Could not add to wishlist: " + (error?.message || "unknown error"));
    } finally {
      setIsAdding(false);
    }
  };

  const handleViewProduct = () => {
    // Navigate to marketplace with search for this product
    navigate(`/marketplace?search=${encodeURIComponent(productData?.title || '')}`);
  };

  const handleBackToMarketplace = () => {
    navigate('/marketplace');
  };

  if (!productData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const isAlreadyWishlisted = user ? isProductWishlisted(productData.id) : false;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Heart className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-xl">Add to Wishlist</CardTitle>
          <CardDescription>
            {productData.source === 'welcome_email' && "Thanks for clicking from your welcome email!"}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-center space-y-2">
            <h3 className="font-semibold text-lg">{productData.title}</h3>
            {productData.price > 0 && (
              <p className="text-2xl font-bold text-primary">{formatPrice(productData.price)}</p>
            )}
          </div>

          <div className="space-y-3">
            {isAlreadyWishlisted ? (
              <div className="text-center space-y-4">
                <p className="text-muted-foreground">✓ This item is already in your wishlist</p>
                <Button 
                  onClick={() => navigate('/wishlists')} 
                  className="w-full"
                >
                  View My Wishlists
                </Button>
              </div>
            ) : (
              <Button 
                onClick={handleAddToWishlist} 
                disabled={isAdding || !user}
                className="w-full"
              >
                {isAdding ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : !user ? (
                  "Sign In to Add to Wishlist"
                ) : (
                  "Add to Wishlist"
                )}
              </Button>
            )}

            <Button 
              variant="outline" 
              onClick={handleViewProduct}
              className="w-full"
            >
              View in Marketplace
            </Button>

            <Button 
              variant="ghost" 
              onClick={handleBackToMarketplace}
              className="w-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Marketplace
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WishlistAdd;