
import React from "react";
import Header from "@/components/home/Header";
import Hero from "@/components/home/Hero";
import HomeContent from "@/components/home/HomeContent";
import Footer from "@/components/home/Footer";
import { ProductProvider } from "@/contexts/ProductContext";

const Index = () => {
  return (
    <ProductProvider>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-1">
          <Hero />
          <HomeContent />
        </main>
        <Footer />
      </div>
    </ProductProvider>
  );
};

export default Index;
