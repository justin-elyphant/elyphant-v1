import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Heart, Plus, Search, Eye, Trash2, ShoppingCart, Filter, Star, Gift, Settings } from "lucide-react";
import { useUnifiedWishlist } from "@/hooks/useUnifiedWishlist";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

const AmazonStyleWishlists = () => {
  const isMobile = useIsMobile();
  const { wishlists, loading } = useUnifiedWishlist();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const allItems = React.useMemo(() => {
    const items = wishlists?.flatMap(wishlist => 
      (wishlist.items || []).map(item => ({
        ...item,
        wishlistName: wishlist.title,
        wishlistId: wishlist.id,
        category: wishlist.category || "general",
        addedDate: item.created_at ? new Date(item.created_at) : new Date()
      }))
    ) || [];
    
    return items.filter(item => {
      const matchesSearch = !searchTerm || 
        item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.wishlistName?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === "all" || 
        item.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [wishlists, searchTerm, selectedCategory]);

  const categories = React.useMemo(() => {
    const cats = new Set(wishlists?.map(w => w.category).filter(Boolean) || []);
    return Array.from(cats);
  }, [wishlists]);

  const totalItems = wishlists?.reduce((total, wishlist) => total + (wishlist.items?.length || 0), 0) || 0;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Heart className="h-6 w-6 text-pink-500" />
            My Wishlists
          </h1>
          <p className="text-muted-foreground">
            {totalItems} items across {wishlists?.length || 0} lists
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New List
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Wishlist</DialogTitle>
              </DialogHeader>
              <CreateWishlistForm />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search all your wishlist items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={selectedCategory === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory("all")}
          >
            All
          </Button>
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="items" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="items">All Items ({totalItems})</TabsTrigger>
          <TabsTrigger value="lists">My Lists ({wishlists?.length || 0})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="items" className="mt-6">
          <ItemsView items={allItems} isMobile={isMobile} />
        </TabsContent>
        
        <TabsContent value="lists" className="mt-6">
          <ListsView wishlists={wishlists || []} isMobile={isMobile} />
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Find More Items</h3>
              <p className="text-sm text-muted-foreground">
                Browse marketplace to add items to your wishlists
              </p>
            </div>
            <Button asChild>
              <Link to="/marketplace">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Browse Marketplace
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Items View Component
const ItemsView = ({ items, isMobile }: { items: any[]; isMobile: boolean }) => {
  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
        <h3 className="font-medium mb-2">No items found</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Try adjusting your search or browse the marketplace
        </p>
        <Button asChild>
          <Link to="/marketplace">Browse Marketplace</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className={cn(
      "grid gap-4",
      isMobile ? "grid-cols-1" : "grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    )}>
      {items.map((item, index) => (
        <Card key={`${item.id}-${index}`} className="group hover:shadow-md transition-shadow">
          <div className="aspect-square relative overflow-hidden rounded-t-lg">
            {item.image_url ? (
              <img 
                src={item.image_url} 
                alt={item.name || item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            ) : (
              <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                <Gift className="h-8 w-8 text-gray-400" />
              </div>
            )}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button size="sm" variant="secondary" className="h-8 w-8 p-0">
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <CardContent className="p-4">
            <div className="space-y-2">
              <h4 className="font-medium line-clamp-2">{item.name || item.title}</h4>
              <p className="text-sm text-muted-foreground">{item.wishlistName}</p>
              <div className="flex items-center justify-between">
                {item.price && (
                  <span className="font-semibold text-lg">${item.price}</span>
                )}
                <Badge variant="secondary" className="text-xs">
                  {item.category || "general"}
                </Badge>
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="flex-1">
                  <ShoppingCart className="h-4 w-4 mr-1" />
                  Buy Now
                </Button>
                <Button size="sm" variant="outline">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// Lists View Component
const ListsView = ({ wishlists, isMobile }: { wishlists: any[]; isMobile: boolean }) => {
  if (wishlists.length === 0) {
    return (
      <div className="text-center py-12">
        <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
        <h3 className="font-medium mb-2">No wishlists yet</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Create your first wishlist to get started
        </p>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Wishlist
        </Button>
      </div>
    );
  }

  return (
    <div className={cn(
      "grid gap-4",
      isMobile ? "grid-cols-1" : "grid-cols-2 lg:grid-cols-3"
    )}>
      {wishlists.map((wishlist) => (
        <Card key={wishlist.id} className="group hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{wishlist.title}</CardTitle>
              <Badge variant="outline">{wishlist.items?.length || 0} items</Badge>
            </div>
            {wishlist.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {wishlist.description}
              </p>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {wishlist.category && (
                <Badge variant="secondary" className="text-xs">
                  {wishlist.category}
                </Badge>
              )}
              
              {/* Preview items */}
              {wishlist.items && wishlist.items.length > 0 && (
                <div className="flex -space-x-2">
                  {wishlist.items.slice(0, 3).map((item: any, index: number) => (
                    <div 
                      key={index}
                      className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center overflow-hidden"
                    >
                      {item.image_url ? (
                        <img 
                          src={item.image_url} 
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Gift className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                  ))}
                  {wishlist.items.length > 3 && (
                    <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center">
                      <span className="text-xs">+{wishlist.items.length - 3}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1">
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
                <Button size="sm" variant="outline">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// Create Wishlist Form Component
const CreateWishlistForm = () => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement wishlist creation
    console.log("Creating wishlist:", formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="title" className="block text-sm font-medium mb-1">
          Wishlist Name
        </label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          placeholder="e.g., Birthday Wishlist, Holiday Gifts"
          required
        />
      </div>
      
      <div>
        <label htmlFor="description" className="block text-sm font-medium mb-1">
          Description (Optional)
        </label>
        <Input
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="What's this wishlist for?"
        />
      </div>
      
      <div>
        <label htmlFor="category" className="block text-sm font-medium mb-1">
          Category
        </label>
        <Input
          id="category"
          value={formData.category}
          onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
          placeholder="e.g., birthday, holiday, general"
        />
      </div>
      
      <div className="flex gap-2">
        <Button type="submit" className="flex-1">Create Wishlist</Button>
        <Button type="button" variant="outline">Cancel</Button>
      </div>
    </form>
  );
};

export default AmazonStyleWishlists;