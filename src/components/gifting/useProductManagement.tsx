
import { useState, useEffect } from "react";
import { Product, useProducts } from "@/contexts/ProductContext";
import { toast } from "sonner";

export const useProductManagement = (initialProducts: Product[] = []) => {
  const { products: contextProducts, isLoading: contextLoading } = useProducts();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [priceRange, setPriceRange] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [wishlistedProducts, setWishlistedProducts] = useState<number[]>([]);
  
  useEffect(() => {
    if (contextProducts && contextProducts.length > 0) {
      setProducts(contextProducts);
      setIsLoading(false);
      return;
    }
    
    if (initialProducts.length > 0) {
      setProducts(initialProducts);
      setIsLoading(false);
      return;
    }
    
    const savedProducts = localStorage.getItem('shopifyProducts');
    if (savedProducts) {
      try {
        const parsedProducts = JSON.parse(savedProducts);
        setProducts(parsedProducts);
        setIsLoading(false);
        return;
      } catch (e) {
        console.error("Error parsing saved products:", e);
      }
    }
    
    const timer = setTimeout(() => {
      const mockProducts = [
        {
          id: 1,
          name: "Wireless Headphones",
          price: 129.99,
          category: "Electronics",
          image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80",
          vendor: "AudioTech",
          variants: ["Black", "White", "Blue"],
          description: "Premium wireless headphones with noise cancellation"
        },
        {
          id: 2,
          name: "Smart Watch",
          price: 249.99,
          category: "Electronics",
          image: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500&q=80",
          vendor: "TechWear",
          variants: ["Black", "Silver"],
          description: "Smart watch with health tracking features"
        },
        {
          id: 3,
          name: "Scented Candle Set",
          price: 39.99,
          category: "Home",
          image: "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=500&q=80",
          vendor: "HomeScents",
          variants: ["Vanilla", "Lavender", "Ocean"],
          description: "Set of 3 premium scented candles"
        },
        {
          id: 4,
          name: "Coffee Mug",
          price: 19.99,
          category: "Home",
          image: "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=500&q=80",
          vendor: "KitchenGoods",
          variants: ["Black", "White", "Blue"],
          description: "Ceramic coffee mug with unique design"
        },
        {
          id: 5,
          name: "Designer Wallet",
          price: 89.99,
          category: "Accessories",
          image: "https://images.unsplash.com/photo-1627123424574-724758594e93?w=500&q=80",
          vendor: "FashionHub",
          variants: ["Brown", "Black"],
          description: "Premium leather wallet with multiple card slots"
        },
        {
          id: 6,
          name: "Plant Pot",
          price: 24.99,
          category: "Home",
          image: "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=500&q=80",
          vendor: "GreenThumb",
          variants: ["Small", "Medium", "Large"],
          description: "Ceramic plant pot with drainage hole"
        },
        {
          id: 7,
          name: "Leather Notebook",
          price: 34.99,
          category: "Stationery",
          image: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=500&q=80",
          vendor: "PaperWorks",
          description: "Premium leather-bound notebook with 200 pages"
        },
        {
          id: 8,
          name: "Essential Oil Diffuser",
          price: 49.99,
          category: "Home",
          image: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=500&q=80",
          vendor: "WellnessHub",
          description: "Ultrasonic essential oil diffuser with LED lights"
        },
      ];
      
      setProducts(mockProducts);
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [contextProducts, initialProducts]);

  useEffect(() => {
    const saved = localStorage.getItem('wishlistedProducts');
    if (saved) {
      try {
        setWishlistedProducts(JSON.parse(saved));
      } catch (e) {
        console.error("Error parsing saved wishlisted products:", e);
      }
    }
  }, []);

  const handleWishlistToggle = (productId: number) => {
    setWishlistedProducts(prev => {
      const newWishlisted = prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId];
      
      localStorage.setItem('wishlistedProducts', JSON.stringify(newWishlisted));
      
      if (newWishlisted.includes(productId)) {
        toast.success("Added to wishlist");
      } else {
        toast.info("Removed from wishlist");
      }
      
      return newWishlisted;
    });
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      searchTerm === "" || 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    
    let matchesPrice = true;
    if (priceRange === "under25") matchesPrice = product.price < 25;
    else if (priceRange === "25to50") matchesPrice = product.price >= 25 && product.price <= 50;
    else if (priceRange === "50to100") matchesPrice = product.price > 50 && product.price <= 100;
    else if (priceRange === "over100") matchesPrice = product.price > 100;
    
    return matchesSearch && matchesCategory && matchesPrice;
  });

  const categories = ["all", ...Array.from(new Set(products.map(p => p.category)))];
  
  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
    setPriceRange("all");
  };

  return {
    products,
    isLoading,
    filteredProducts,
    categories,
    searchTerm,
    setSearchTerm,
    priceRange,
    setPriceRange,
    selectedCategory,
    setSelectedCategory,
    filtersVisible,
    setFiltersVisible,
    wishlistedProducts,
    handleWishlistToggle,
    clearFilters
  };
};
