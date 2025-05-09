
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth";

const HomeContent = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  return (
    <div className="container mx-auto py-12 px-4 text-center">
      <h1 className="text-4xl font-bold mb-6">Welcome to Gift Giver</h1>
      <p className="text-xl mb-8">Find and share perfect gifts for every occasion</p>
      
      <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
        {!user ? (
          <>
            <Button 
              onClick={() => navigate("/sign-up")} 
              size="lg" 
              className="bg-purple-600 hover:bg-purple-700"
            >
              Create Account
            </Button>
            <Button 
              onClick={() => navigate("/sign-in")} 
              size="lg" 
              variant="outline"
            >
              Sign In
            </Button>
          </>
        ) : (
          <>
            <Button 
              onClick={() => navigate("/dashboard")} 
              size="lg" 
              className="bg-purple-600 hover:bg-purple-700"
            >
              Go to Dashboard
            </Button>
            <Button 
              onClick={() => navigate("/wishlists")} 
              size="lg" 
              variant="outline"
            >
              My Wishlists
            </Button>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-3">Create Wishlists</h2>
          <p className="text-gray-600">Build personalized wishlists for any occasion and share them with friends and family.</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-3">Discover Perfect Gifts</h2>
          <p className="text-gray-600">Browse curated gift ideas tailored to your loved ones' interests and preferences.</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-3">Collaborate on Gifts</h2>
          <p className="text-gray-600">Join forces with others to contribute towards meaningful gifts for special occasions.</p>
        </div>
      </div>
    </div>
  );
};

export default HomeContent;
