import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Gift, Heart, Package, Target, Eye, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useAuth } from "@/contexts/auth";
import { useUnifiedWishlistSystem } from "@/hooks/useUnifiedWishlistSystem";
import ProductDetailsDialog from "@/components/marketplace/ProductDetailsDialog";
import { toast } from "sonner";
import { normalizeImageUrl } from "@/utils/normalizeImageUrl";

const CollectionsTab = () => {
  const { wishlists, loading, removeFromWishlist } = useUnifiedWishlistSystem();
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
        wishlistId: wishlist.id,
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
      description: item.description,
      features: item.features || [],
      specifications: item.specifications || {},
      category: item.category,
      tags: item.tags || [],
      rating: item.rating,
      review_count: item.review_count,
      availability: item.availability || 'in_stock'
    };
    
    setSelectedProduct(productData);
    setShowProductDetails(true);
  };

  const handleRemoveItem = async (e: React.MouseEvent, item: any) => {
    e.stopPropagation(); // Prevent opening product details
    try {
      await removeFromWishlist({ 
        wishlistId: item.wishlistId, 
        itemId: item.id 
      });
      toast.success(`Removed ${item.name} from ${item.wishlistName}`);
    } catch (error) {
      console.error("Error removing item:", error);
      toast.error("Failed to remove item");
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="p-4 border rounded-lg animate-pulse">
              <div className="w-full h-32 bg-gray-200 rounded mb-3" />
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
      {/* Horizontal Stats Bar */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        <Card className="text-center hover:shadow-md transition-shadow flex-shrink-0 min-w-[100px]">
          <CardContent className="p-3">
            <div className="flex items-center justify-center mb-1">
              <Heart className="h-5 w-5 text-red-500" />
            </div>
            <div className="text-xl font-bold text-primary">
              {wishlistCount}
            </div>
            <div className="text-xs text-muted-foreground whitespace-nowrap">
              Total Wishlists
            </div>
          </CardContent>
        </Card>

        <Card className="text-center hover:shadow-md transition-shadow flex-shrink-0 min-w-[100px]">
          <CardContent className="p-3">
            <div className="flex items-center justify-center mb-1">
              <Gift className="h-5 w-5 text-blue-500" />
            </div>
            <div className="text-xl font-bold text-primary">
              {totalItems}
            </div>
            <div className="text-xs text-muted-foreground whitespace-nowrap">
              Total Items
            </div>
          </CardContent>
        </Card>

        <Card className="text-center hover:shadow-md transition-shadow flex-shrink-0 min-w-[100px]">
          <CardContent className="p-3">
            <div className="flex items-center justify-center mb-1">
              <Target className="h-5 w-5 text-green-500" />
            </div>
            <div className="text-xl font-bold text-primary">
              ${allItems.reduce((total, item) => total + (item.price || 0), 0).toFixed(0)}
            </div>
            <div className="text-xs text-muted-foreground whitespace-nowrap">
              Total Value
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Items */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Recent Items</h3>
          <Button variant="outline" size="sm" asChild>
            <Link to="/wishlists">
              <Eye className="h-4 w-4 mr-2" />
              View All Lists
            </Link>
          </Button>
        </div>
        
        {allItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-safe-or-6"
            style={{ paddingBottom: 'max(1.5rem, calc(env(safe-area-inset-bottom, 0px) + 4rem))' }}
          >
            {allItems.slice(0, 6).map((item) => (
              <Card 
                key={item.id} 
                className="cursor-pointer hover:shadow-md transition-shadow relative group"
                onClick={() => handleProductClick(item)}
              >
                <CardContent className="p-4">
                  {/* Remove Button */}
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 h-8 w-8 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    onClick={(e) => handleRemoveItem(e, item)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>

                  <div className="aspect-square bg-gray-100 rounded-lg mb-3 overflow-hidden">
                    {item.image_url ? (
                      <img 
                        src={normalizeImageUrl(item.image_url, { bucket: 'product-images', fallback: '/placeholder.svg' })} 
                        alt={item.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.warn('Failed to load collection item image:', item.image_url);
                          e.currentTarget.src = '/placeholder.svg';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <h4 className="font-medium line-clamp-2 mb-1">{item.name}</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    From: {item.wishlistName}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-primary">
                      {formatPrice(item.price || 0)}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {format(item.addedDate, 'MMM d')}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border rounded-lg bg-gray-50 dark:bg-gray-800 mb-safe-or-6"
            style={{ marginBottom: 'max(1.5rem, calc(env(safe-area-inset-bottom, 0px) + 4rem))' }}
          >
            <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h4 className="font-medium mb-2">No wishlist items yet</h4>
            <p className="text-sm text-muted-foreground mb-6">
              Start adding items to your wishlists to see them here
            </p>
            <Button asChild>
              <Link to="/marketplace">
                <Search className="h-4 w-4 mr-2" />
                Browse Products
              </Link>
            </Button>
          </div>
        )}
      </div>

      {/* Product Details Dialog */}
      {selectedProduct && (
        <ProductDetailsDialog
          product={selectedProduct}
          open={showProductDetails}
          onOpenChange={setShowProductDetails}
          userData={user}
        />
      )}
    </div>
  );
};

export default CollectionsTab;