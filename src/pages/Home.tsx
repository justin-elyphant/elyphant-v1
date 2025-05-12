
import React from "react";
import HomeContent from "@/components/home/HomeContent";
import Header from "@/components/home/Header";
import { ProductProvider } from "@/contexts/ProductContext";

const Home = () => {
  return (
    <ProductProvider>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow">
          <HomeContent />
        </main>
      </div>
    </ProductProvider>
  );
};

export default Home;
