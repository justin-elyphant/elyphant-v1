
import React, { useState } from "react";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { toast } from "sonner";
import WishlistHeader from "./wishlist/WishlistHeader";
import CreateWishlistCard from "./wishlist/CreateWishlistCard";
import WishlistCard, { WishlistData } from "./wishlist/WishlistCard";
import CreateWishlistDialog from "./wishlist/CreateWishlistDialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LightbulbIcon } from "lucide-react";
import EditWishlistDialog from "./wishlist/EditWishlistDialog";

// Mock data for wishlists
const initialWishlists = [
  {
    id: 1,
    title: "Birthday Wishlist",
    description: "Things I'd love to receive for my birthday",
    items: [
      { id: 1, name: "Wireless Headphones", price: 199, brand: "Bose", imageUrl: "/placeholder.svg" },
      { id: 2, name: "Smart Watch", price: 349, brand: "Apple", imageUrl: "/placeholder.svg" },
      { id: 3, name: "Fitness Tracker", price: 129, brand: "Fitbit", imageUrl: "/placeholder.svg" },
    ]
  },
  {
    id: 2,
    title: "Holiday Wishlist",
    description: "Gift ideas for the holidays",
    items: [
      { id: 4, name: "Leather Wallet", price: 89, brand: "Coach", imageUrl: "/placeholder.svg" },
      { id: 5, name: "Portable Speaker", price: 129, brand: "JBL", imageUrl: "/placeholder.svg" },
    ]
  }
];

const MyWishlists = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentWishlist, setCurrentWishlist] = useState<WishlistData | null>(null);
  const [wishlists, setWishlists] = useLocalStorage<WishlistData[]>("userWishlists", initialWishlists);

  const handleCreateWishlist = () => {
    setDialogOpen(true);
  };

  const handleDialogSubmit = (values: { title: string; description?: string }) => {
    const newWishlist: WishlistData = {
      id: Date.now(),
      title: values.title,
      description: values.description || "",
      items: []
    };

    setWishlists((prev) => [...prev, newWishlist]);
    toast.success("Wishlist created successfully!");
  };

  const handleEditWishlist = (id: number) => {
    console.log(`Edit wishlist ${id}`);
    const wishlistToEdit = wishlists.find(wishlist => wishlist.id === id);
    if (wishlistToEdit) {
      setCurrentWishlist(wishlistToEdit);
      setEditDialogOpen(true);
    }
  };

  const handleEditDialogSubmit = (values: { title: string; description?: string }) => {
    if (currentWishlist) {
      const updatedWishlists = wishlists.map(wishlist => 
        wishlist.id === currentWishlist.id 
          ? { ...wishlist, title: values.title, description: values.description || "" } 
          : wishlist
      );
      
      setWishlists(updatedWishlists);
      toast.success("Wishlist updated successfully!");
    }
  };

  const handleShareWishlist = (id: number) => {
    console.log(`Share wishlist ${id}`);
    toast.info("Sharing feature coming soon!");
  };

  return (
    <div>
      <WishlistHeader title="My Wishlists" onCreateNew={handleCreateWishlist} />
      
      {wishlists.length > 0 && (
        <Alert className="mb-6 bg-blue-50 border-blue-200">
          <LightbulbIcon className="h-4 w-4 text-blue-600" />
          <AlertDescription>
            Create wishlists for different occasions and share them with friends and family. Browse the marketplace to add items to your wishlists.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <CreateWishlistCard onCreateNew={handleCreateWishlist} />
        
        {/* Existing wishlists */}
        {wishlists.map((wishlist: WishlistData) => (
          <WishlistCard 
            key={wishlist.id}
            wishlist={wishlist}
            onEdit={handleEditWishlist}
            onShare={handleShareWishlist}
          />
        ))}
      </div>

      <CreateWishlistDialog 
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleDialogSubmit}
      />

      <EditWishlistDialog 
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSubmit={handleEditDialogSubmit}
        wishlist={currentWishlist}
      />
    </div>
  );
};

export default MyWishlists;
