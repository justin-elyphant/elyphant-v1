
import React from "react";
import Header from "@/components/home/Header";
import HomeContent from "@/components/home/HomeContent";
import Footer from "@/components/home/Footer";

const Home = () => {
  return (
    <>
      <Header />
      <main>
        <HomeContent />
      </main>
      <Footer />
    </>
  );
};

export default Home;
