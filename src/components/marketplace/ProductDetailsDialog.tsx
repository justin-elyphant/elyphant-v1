
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Product } from "@/contexts/ProductContext";
import ProductCarousel from "./product-details/ProductCarousel";
import ProductInfo from "./product-details/ProductInfo";
import ProductActions from "./product-details/ProductActions";
import { useProductImages } from "./product-details/useProductImages";
import { useProductRecommendations } from "@/hooks/useProductRecommendations";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, Box, Truck, Heart } from "lucide-react";
import ProductItem from "./product-item/ProductItem";
import { Badge } from "@/components/ui/badge";
import { useQuickWishlist } from "@/hooks/useQuickWishlist";
import { Button } from "@/components/ui/button";
import WishlistSelectionPopover from "./WishlistSelectionPopover";

interface ProductDetailsDialogProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userData: any | null;
}

const ProductDetailsDialog = ({ 
  product, 
  open, 
  onOpenChange,
  userData
}: ProductDetailsDialogProps) => {
  const [activeTab, setActiveTab] = useState("details");
  
  // Get our wishlist functionality
  const { toggleWishlist, isFavorited } = useQuickWishlist();
  
  if (!product) return null;

  console.log("ProductDetailsDialog rendering with product:", product);
  
  // Get the product images
  const images = useProductImages(product);
  console.log("Final images to display:", images);
  
  // Get related products from recommendations hook
  const { recommendations, isLoading: loadingRecommendations } = useProductRecommendations(
    product.product_id || product.id
  );

  // Handle product click for recommendations
  const handleProductClick = (productId: string) => {
    console.log("Recommendation clicked:", productId);
    // You might want to implement navigation to the product detail page
    // or open a new dialog for this product
  };

  // Generate mock reviews if the product doesn't have any
  const mockReviews = [
    {
      name: "Sarah L.",
      rating: 5,
      date: "2 weeks ago",
      comment: "Absolutely love this product! Shipping was fast and the quality exceeded my expectations."
    },
    {
      name: "Michael T.",
      rating: 4,
      date: "1 month ago",
      comment: "Good product overall. Would have given 5 stars but the packaging could be improved."
    },
    {
      name: "Jessica R.",
      rating: 5,
      date: "3 months ago",
      comment: "Perfect gift for my friend. They loved it and I'll definitely order again!"
    }
  ];

  // Create a trigger button for the wishlist popover
  const wishlistTrigger = (
    <Button 
      variant="outline" 
      size="sm" 
      className="flex items-center gap-1.5 h-9"
      id={`wishlist-trigger-${product.product_id || product.id}`}
    >
      <Heart 
        className={`h-4 w-4 ${isFavorited(product.product_id || product.id) ? "fill-primary text-primary" : ""}`} 
      />
      {isFavorited(product.product_id || product.id) ? 'Saved' : 'Save to Wishlist'}
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{product.title || product.name}</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground line-clamp-2">
            {product.description || `High-quality ${product.category || 'product'} from ${product.vendor || product.retailer || 'our marketplace'}`}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          <div className="relative overflow-hidden rounded-md">
            <ProductCarousel images={images} productName={product.title || product.name || ""} />
          </div>
          
          <div className="flex flex-col space-y-4">
            <ProductInfo product={product} />
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <ProductActions product={product} userData={userData} />
              
              <WishlistSelectionPopover
                productId={product.product_id || product.id || ""}
                productName={product.title || product.name || ""}
                productImage={product.image}
                productPrice={product.price}
                productBrand={product.brand}
                trigger={wishlistTrigger}
              />
            </div>
            
            {/* Product badges */}
            <div className="flex flex-wrap gap-2 mt-2">
              {product.isBestSeller && (
                <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">
                  Best Seller
                </Badge>
              )}
              {product.prime && (
                <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                  Prime Shipping
                </Badge>
              )}
              {product.tags?.includes("limited") && (
                <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
                  Limited Stock
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="details">
              <Box className="h-4 w-4 mr-2" />
              Details
            </TabsTrigger>
            <TabsTrigger value="reviews">
              <Star className="h-4 w-4 mr-2" />
              Reviews
            </TabsTrigger>
            <TabsTrigger value="shipping">
              <Truck className="h-4 w-4 mr-2" />
              Shipping
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="pt-4">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Product Details</h3>
              <div className="text-sm">
                <p className="mb-4">{product.description}</p>
                <ul className="list-disc pl-5 space-y-1">
                  {product.product_details?.map((detail, idx) => (
                    <li key={idx}>{detail}</li>
                  )) || (
                    <>
                      <li>Category: {product.category || "General"}</li>
                      <li>Brand: {product.brand || "Various"}</li>
                      {product.variants && <li>Available options: {product.variants.join(", ")}</li>}
                    </>
                  )}
                </ul>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="reviews" className="pt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Customer Reviews</h3>
                <div className="flex items-center">
                  <span className="text-amber-500 flex">
                    {Array(5).fill(0).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${i < (product.rating || 4) ? "fill-current" : ""}`}
                      />
                    ))}
                  </span>
                  <span className="ml-2 text-sm">
                    {product.rating || 4.5}/5 ({product.reviewCount || product.num_reviews || mockReviews.length} reviews)
                  </span>
                </div>
              </div>
              
              <div className="space-y-4">
                {mockReviews.map((review, idx) => (
                  <Card key={idx}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{review.name}</p>
                          <div className="flex text-amber-500 mt-1">
                            {Array(5).fill(0).map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3 w-3 ${i < review.rating ? "fill-current" : ""}`}
                              />
                            ))}
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground">{review.date}</span>
                      </div>
                      <p className="mt-2 text-sm">{review.comment}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="shipping" className="pt-4">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Shipping Information</h3>
              <div className="text-sm">
                <p className="mb-2">
                  {product.prime ? (
                    <span className="flex items-center">
                      <Badge className="mr-2 bg-blue-100 text-blue-800 border-blue-200">Prime</Badge>
                      Fast shipping available - get it in 1-2 business days
                    </span>
                  ) : (
                    "Standard shipping - typically 3-5 business days"
                  )}
                </p>
                
                <ul className="list-disc pl-5 space-y-1 mt-4">
                  <li>Free shipping on orders over $35</li>
                  <li>International shipping available to select countries</li>
                  <li>Expedited shipping options available at checkout</li>
                </ul>
                
                <div className="mt-4 p-3 bg-gray-50 rounded-md">
                  <p className="text-sm font-medium">Return Policy</p>
                  <p className="text-xs mt-1">
                    Easy returns within 30 days of delivery. See our full return policy for more details.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Related Products */}
        <div className="mt-6 pt-6 border-t">
          <h3 className="text-lg font-medium mb-4">You Might Also Like</h3>
          <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-3">
            {recommendations.slice(0, 3).map((relatedProduct) => (
              <ProductItem 
                key={relatedProduct.product_id || relatedProduct.id || ""}
                product={relatedProduct}
                viewMode="grid"
                onProductClick={handleProductClick}
                onWishlistClick={(e) => toggleWishlist(e, {
                  id: relatedProduct.product_id || relatedProduct.id || "",
                  name: relatedProduct.title || relatedProduct.name || "",
                  image: relatedProduct.image,
                  price: relatedProduct.price
                })}
                isFavorited={isFavorited(relatedProduct.product_id || relatedProduct.id || "")}
              />
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductDetailsDialog;
