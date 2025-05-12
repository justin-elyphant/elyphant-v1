
import React from "react";
import HomeContent from "@/components/home/HomeContent";
import Header from "@/components/home/Header";

const Home = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        <HomeContent />
      </main>
    </div>
  );
};

export default Home;
