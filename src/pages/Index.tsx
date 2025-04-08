
import React from "react";
import HomeContent from "@/components/home/HomeContent";
import { ProductProvider } from "@/contexts/ProductContext";

const Index = () => {
  return (
    <ProductProvider>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <main className="flex-1">
          <HomeContent />
        </main>
      </div>
    </ProductProvider>
  );
};

export default Index;
