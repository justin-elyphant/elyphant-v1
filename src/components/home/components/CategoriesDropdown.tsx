
import React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { searchProducts } from "@/components/marketplace/zinc/zincService";
import { useProducts } from "@/contexts/ProductContext";

export const categories = [
  { name: "Accessories", url: "accessories", searchTerm: "accessories" },
  { name: "Art & Collectibles", url: "art-collectibles", searchTerm: "art collectibles" },
  { name: "Baby", url: "baby", searchTerm: "baby products" },
  { name: "Bags & Purses", url: "bags-purses", searchTerm: "bags purses" },
  { name: "Bath & Beauty", url: "bath-beauty", searchTerm: "bath beauty products" },
  { name: "Books, Movies & Music", url: "books-movies-music", searchTerm: "books movies music" },
  { name: "Clothing", url: "clothing", searchTerm: "clothing" },
  { name: "Craft Supplies & Tools", url: "craft-supplies", searchTerm: "craft supplies" },
  { name: "Electronics & Accessories", url: "electronics", searchTerm: "electronics" },
  { name: "Experiences", url: "experiences", searchTerm: "experience gifts" },
  { name: "Gifts", url: "gifts", searchTerm: "gifts" },
  { name: "Home & Living", url: "home-living", searchTerm: "home living" },
  { name: "Jewelry", url: "jewelry", searchTerm: "jewelry" },
  { name: "Toys & Games", url: "toys-games", searchTerm: "toys games" },
  { name: "Wedding & Party", url: "wedding-party", searchTerm: "wedding party" }
];

interface CategoriesDropdownProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CategoriesDropdown: React.FC<CategoriesDropdownProps> = ({ 
  open, 
  onOpenChange 
}) => {
  const navigate = useNavigate();
  const { setProducts } = useProducts();

  const handleCategorySelect = async (category: string, searchTerm: string) => {
    // Show loading toast
    toast.loading(`Loading ${searchTerm} products...`, {
      id: "category-search",
    });
    
    try {
      // Fetch products for this category
      const results = await searchProducts(searchTerm);
      
      if (results && results.length > 0) {
        // Convert to Product format
        const categoryProducts = results.map((product, index) => ({
          id: 2000 + index,
          name: product.title,
          price: product.price,
          category: product.category || "Electronics",
          image: product.image || "/placeholder.svg",
          vendor: "Amazon via Zinc",
          description: product.description || "",
          rating: product.rating,
          reviewCount: product.review_count
        }));
        
        // Update products in context
        setProducts(prevProducts => {
          // Filter out any existing Amazon products
          const nonAmazonProducts = prevProducts.filter(p => p.vendor !== "Amazon via Zinc");
          // Add the new category products
          return [...nonAmazonProducts, ...categoryProducts];
        });
        
        // Success toast
        toast.success(`Found ${results.length} ${searchTerm} products`, {
          id: "category-search",
        });
      } else {
        toast.error(`No products found in ${category}`, {
          id: "category-search",
        });
      }
    } catch (error) {
      console.error("Error fetching category products:", error);
      toast.error("Error loading category products", {
        id: "category-search",
      });
    }
    
    // Navigate to marketplace with category parameter
    navigate(`/marketplace?category=${category}&search=${encodeURIComponent(searchTerm)}`);
    onOpenChange(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-1">
          Categories <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="w-56 bg-white p-0 max-h-[70vh] overflow-y-auto z-50" 
        align="start"
      >
        {categories.map((category, index) => (
          <DropdownMenuItem 
            key={index} 
            className="px-4 py-2 hover:bg-accent cursor-pointer"
            onClick={() => handleCategorySelect(category.url, category.searchTerm)}
          >
            {category.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default CategoriesDropdown;
