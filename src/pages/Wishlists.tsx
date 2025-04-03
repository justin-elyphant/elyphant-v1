
import React from "react";
import MyWishlists from "@/components/gifting/MyWishlists";

const Wishlists = () => {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">My Wishlists</h1>
        <p className="text-muted-foreground mt-2">
          Create and manage wishlists to share with friends and family
        </p>
      </div>
      
      <MyWishlists />
    </div>
  );
};

export default Wishlists;
