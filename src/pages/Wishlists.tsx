
import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import MyWishlists from "@/components/gifting/MyWishlists";

const Wishlists = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-6">
          <Button variant="ghost" asChild className="p-0">
            <Link to="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold">My Wishlists</h1>
          <p className="text-muted-foreground mt-2">
            Create and manage wishlists to share with friends and family
          </p>
        </div>
        
        <MyWishlists />
      </div>
    </div>
  );
};

export default Wishlists;
