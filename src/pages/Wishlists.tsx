
import React from "react";
import MainLayout from "@/components/layout/MainLayout";
import AmazonStyleWishlists from "@/components/wishlists/AmazonStyleWishlists";
import { EventsProvider } from "@/components/gifting/events/context/EventsContext";

const Wishlists = () => {
  return (
    <MainLayout>
      <EventsProvider>
        <div className="container max-w-7xl mx-auto py-8 px-4">
          <AmazonStyleWishlists />
        </div>
      </EventsProvider>
    </MainLayout>
  );
};

export default Wishlists;
