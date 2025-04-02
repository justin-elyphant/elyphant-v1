import React, { useState } from "react";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { toast } from "sonner";
import WishlistHeader from "./wishlist/WishlistHeader";
import CreateWishlistCard from "./wishlist/CreateWishlistCard";
import WishlistCard, { WishlistData } from "./wishlist/WishlistCard";
import CreateWishlistDialog from "./wishlist/CreateWishlistDialog";

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
  };

  const handleEditWishlist = (id: number) => {
    console.log(`Edit wishlist ${id}`);
    // Implementation for editing a wishlist
  };

  const handleShareWishlist = (id: number) => {
    console.log(`Share wishlist ${id}`);
    // Implementation for sharing a wishlist
  };

  return (
    <div>
      <WishlistHeader title="My Wishlists" onCreateNew={handleCreateWishlist} />
      
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
    </div>
  );
};

export default MyWishlists;
