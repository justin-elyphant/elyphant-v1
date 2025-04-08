
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Product } from "@/contexts/ProductContext";
import { useCart } from "@/contexts/CartContext";
import { Heart, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import ProductRating from "@/components/shared/ProductRating";
import { 
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from "@/components/ui/carousel";

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
  const { addToCart } = useCart();

  if (!product) return null;

  console.log("ProductDetailsDialog rendering with product:", product);
  
  // Create a proper images array, ensuring it always has values
  let images = [];
  
  // 1. Check if product has an 'images' array with content
  if (product.images && product.images.length > 0) {
    images = product.images;
    console.log("Using product.images array:", images);
  } 
  // 2. If no images array or it's empty, use the single image
  else if (product.image) {
    images = [product.image];
    console.log("Using single product.image:", images);
  } 
  // 3. Fallback to placeholder if no images are available
  else {
    images = ["/placeholder.svg"];
    console.log("Using placeholder image");
  }
  
  console.log("Final images to display:", images);

  // If description is empty, generate a simple one based on the product name and category
  let description = product.description;
  if (!description || description.trim() === "") {
    const productType = product.name.split(' ').slice(1).join(' ');
    const brand = product.name.split(' ')[0];
    description = `The ${brand} ${productType} is a high-quality product designed for performance and reliability. This ${product.category.toLowerCase()} item features premium materials and exceptional craftsmanship for long-lasting use.`;
  }
  
  const features = product.features || [];
  const specifications = product.specifications || {};

  // Create a function to render the carousel
  const renderCarousel = () => {
    // If no images available, show placeholder
    if (images.length === 0) {
      return (
        <div className="aspect-square relative bg-gray-100 flex items-center justify-center">
          <span className="text-muted-foreground">No image available</span>
        </div>
      );
    }
    
    // If only one image, just show it directly
    if (images.length === 1) {
      return (
        <div className="aspect-square relative">
          <img 
            src={images[0]} 
            alt={product.name}
            className="w-full h-full object-cover rounded-md"
            onError={(e) => {
              console.error("Image failed to load:", images[0]);
              e.currentTarget.src = "/placeholder.svg";
            }}
          />
        </div>
      );
    }

    // If multiple images, show carousel with navigation
    return (
      <Carousel className="w-full">
        <CarouselContent>
          {images.map((img, idx) => (
            <CarouselItem key={idx}>
              <div className="aspect-square relative">
                <img 
                  src={img} 
                  alt={`${product.name} view ${idx + 1}`}
                  className="w-full h-full object-cover rounded-md"
                  onError={(e) => {
                    console.error("Image failed to load:", img);
                    e.currentTarget.src = "/placeholder.svg";
                  }}
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        {images.length > 1 && (
          <>
            <CarouselPrevious className="left-2" />
            <CarouselNext className="right-2" />
          </>
        )}
      </Carousel>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl">{product.name}</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground line-clamp-2">
            {description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          <div className="relative overflow-hidden rounded-md">
            {renderCarousel()}
          </div>
          
          <div className="flex flex-col space-y-4">
            <div>
              <h3 className="text-2xl font-bold">${product.price.toFixed(2)}</h3>
              <ProductRating rating={product.rating} reviewCount={product.reviewCount} size="lg" />
              <span className="text-green-600 text-sm block mt-2">Free shipping</span>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Description</h4>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>

              {features.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Features</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground">
                    {features.map((feature, idx) => (
                      <li key={idx}>{feature}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {Object.keys(specifications).length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Specifications</h4>
                  <div className="text-sm grid grid-cols-2 gap-x-4 gap-y-2">
                    {Object.entries(specifications).map(([key, value], idx) => (
                      <React.Fragment key={idx}>
                        <span className="text-muted-foreground">{key}:</span>
                        <span>{value}</span>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-auto pt-4 flex flex-col space-y-2">
              <Button 
                onClick={() => {
                  addToCart(product);
                  toast.success("Product added to cart!");
                }}
                className="w-full"
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Add to Cart
              </Button>
              
              {userData && (
                <Button variant="outline" className="w-full">
                  <Heart className="h-4 w-4 mr-2" />
                  Add to Wishlist
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductDetailsDialog;
