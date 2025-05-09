
import React from "react";
import HomeContent from "@/components/home/HomeContent";
import { ProductProvider } from "@/contexts/ProductContext";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow">
        <ProductProvider>
          <HomeContent />
        </ProductProvider>
      </main>
    </div>
  );
};

export default Index;
