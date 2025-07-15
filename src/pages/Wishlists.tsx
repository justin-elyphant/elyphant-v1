
import React from "react";
import OptimizedLayout from "@/components/layout/OptimizedLayout";
import AmazonStyleWishlists from "@/components/wishlists/AmazonStyleWishlists";
import { EventsProvider } from "@/components/gifting/events/context/EventsContext";

const Wishlists = () => {
  return (
    <OptimizedLayout>
      <EventsProvider>
        <div className="container max-w-7xl mx-auto py-8 px-4">
          <AmazonStyleWishlists />
        </div>
      </EventsProvider>
    </OptimizedLayout>
  );
};

export default Wishlists;
