
import React from "react";
import HomeContent from "@/components/home/HomeContent";
import { ProductProvider } from "@/contexts/ProductContext";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <ProductProvider>
        <main className="flex-grow">
          <HomeContent />
        </main>
      </ProductProvider>
    </div>
  );
};

export default Index;
