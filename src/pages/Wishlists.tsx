
import React from "react";
import MyWishlists from "@/components/gifting/MyWishlists";

const Wishlists = () => {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <p className="text-muted-foreground">
          Create and manage wishlists to share with friends and family
        </p>
      </div>
      
      <MyWishlists />
    </div>
  );
};

export default Wishlists;
