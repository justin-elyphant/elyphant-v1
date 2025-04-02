import React from "react";
import WishlistHeader from "./wishlist/WishlistHeader";
import CreateWishlistCard from "./wishlist/CreateWishlistCard";
import WishlistCard, { WishlistData } from "./wishlist/WishlistCard";

// Mock data for wishlists
const myWishlists = [
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
  const handleCreateWishlist = () => {
    console.log("Create new wishlist");
    // Implementation for creating a new wishlist
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
        {myWishlists.map((wishlist: WishlistData) => (
          <WishlistCard 
            key={wishlist.id}
            wishlist={wishlist}
            onEdit={handleEditWishlist}
            onShare={handleShareWishlist}
          />
        ))}
      </div>
    </div>
  );
};

export default MyWishlists;
