
import React from "react";
import HomeContent from "@/components/home/HomeContent";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Check if we should display user journey guide
  const showJourneyGuide = user && localStorage.getItem("newSignUp") === "true";
  
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow">
        <HomeContent />
        
        {showJourneyGuide && (
          <div className="container mx-auto py-8 px-4">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-8">
              <h2 className="text-2xl font-bold text-purple-800 mb-4">Welcome to Gift Giver!</h2>
              <p className="text-purple-700 mb-4">
                Now that you've created your account, here's what you can do next:
              </p>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="bg-purple-200 rounded-full w-6 h-6 flex items-center justify-center text-purple-800 font-bold mr-3 mt-0.5">1</div>
                  <div>
                    <h3 className="font-semibold text-purple-800">Complete your profile</h3>
                    <p className="text-purple-700 text-sm mb-2">Add your interests and preferences to help others find perfect gifts for you.</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-purple-300 text-purple-700 hover:bg-purple-100"
                      onClick={() => navigate("/profile-setup")}
                    >
                      Set up profile <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-purple-200 rounded-full w-6 h-6 flex items-center justify-center text-purple-800 font-bold mr-3 mt-0.5">2</div>
                  <div>
                    <h3 className="font-semibold text-purple-800">Create your first wishlist</h3>
                    <p className="text-purple-700 text-sm mb-2">Start adding items you'd love to receive to your wishlist.</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-purple-300 text-purple-700 hover:bg-purple-100"
                      onClick={() => navigate("/wishlists")}
                    >
                      Create wishlist <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-purple-200 rounded-full w-6 h-6 flex items-center justify-center text-purple-800 font-bold mr-3 mt-0.5">3</div>
                  <div>
                    <h3 className="font-semibold text-purple-800">Explore gift ideas</h3>
                    <p className="text-purple-700 text-sm mb-2">Browse our curated marketplace for inspiration.</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-purple-300 text-purple-700 hover:bg-purple-100"
                      onClick={() => navigate("/marketplace")}
                    >
                      Explore marketplace <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-purple-200 rounded-full w-6 h-6 flex items-center justify-center text-purple-800 font-bold mr-3 mt-0.5">4</div>
                  <div>
                    <h3 className="font-semibold text-purple-800">Take the interactive tour</h3>
                    <p className="text-purple-700 text-sm mb-2">Learn about all features with our guided onboarding experience.</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-purple-300 text-purple-700 hover:bg-purple-100"
                      onClick={() => navigate("/onboarding")}
                    >
                      Start onboarding <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
