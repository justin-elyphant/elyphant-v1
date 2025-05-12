
import React from "react";
import HomeContent from "@/components/home/HomeContent";
import Header from "@/components/home/Header";
import Footer from "@/components/home/Footer";
import { ProductProvider } from "@/contexts/ProductContext";
import { OrderNotificationDemo } from "@/components/notifications/OrderStatusNotification";

const Home = () => {
  // Show demo notifications for testers only when in development mode
  const isTestingMode = process.env.NODE_ENV === 'development' || 
                       window.location.hostname.includes('localhost');
  
  return (
    <ProductProvider>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow">
          <HomeContent />
          
          {isTestingMode && (
            <div className="container mx-auto py-8 px-4">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h2 className="text-xl font-bold mb-4">Testing Tools</h2>
                <OrderNotificationDemo />
              </div>
            </div>
          )}
        </main>
        <Footer />
      </div>
    </ProductProvider>
  );
};

export default Home;
