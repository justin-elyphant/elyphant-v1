
import React from "react";
import BackToDashboard from "@/components/shared/BackToDashboard";
import MyWishlists from "@/components/gifting/MyWishlists";
import MainLayout from "@/components/layout/MainLayout";
import { ProductProvider } from "@/contexts/ProductContext";

const Wishlists = () => {
  return (
    <MainLayout>
      <ProductProvider>
        <div className="container mx-auto py-8 px-4">
          <BackToDashboard />
          <h1 className="text-2xl font-bold mb-6">My Wishlists</h1>
          <MyWishlists />
        </div>
      </ProductProvider>
    </MainLayout>
  );
};

export default Wishlists;
