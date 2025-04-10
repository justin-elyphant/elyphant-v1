
import React from "react";
import Header from "@/components/home/Header";
import Footer from "@/components/home/Footer";
import HomeContent from "@/components/home/HomeContent";
import ZincConnectCard from "@/components/marketplace/zinc/ZincConnectCard";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        <HomeContent />
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <ZincConnectCard />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
