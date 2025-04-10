
import React from "react";
import HomeContent from "@/components/home/HomeContent";
import Header from "@/components/home/Header";
import Footer from "@/components/home/Footer";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        <HomeContent />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
