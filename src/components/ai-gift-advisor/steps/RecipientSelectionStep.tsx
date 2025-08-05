
import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, UserPlus, Lock, Sparkles } from "lucide-react";
import { useGiftAdvisorBot } from "../hooks/useGiftAdvisorBot";
import { useAuth } from "@/contexts/auth";

type RecipientSelectionStepProps = ReturnType<typeof useGiftAdvisorBot>;

const RecipientSelectionStep = ({ connections, selectFriend, nextStep, botState }: RecipientSelectionStepProps) => {
  const handleSomeoneElse = () => {
    nextStep("manual-input");
  };

  const { user } = useAuth();
  const isAuthenticated = botState.isAuthenticated;
  const userFirstName = user?.user_metadata?.first_name;

  // Mock friend data for preview (when not authenticated)
  const mockFriends = [
    { id: "mock1", name: "Sarah Johnson", hasWishlist: true },
    { id: "mock2", name: "Mike Chen", hasWishlist: true },
    { id: "mock3", name: "Emma Davis", hasWishlist: false }
  ];

  const displayConnections = isAuthenticated ? connections : mockFriends;

  return (
    <div className="flex flex-col h-full p-4 space-y-4">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold mb-2">
          {isAuthenticated 
            ? `Perfect${userFirstName ? `, ${userFirstName}` : ''}! Who would you like to set up auto-gifting for?`
            : "Who are you shopping for?"
          }
        </h3>
        <p className="text-sm text-gray-600">
          {isAuthenticated 
            ? "I can use your friend connections to make this super easy" 
            : "Select a friend or choose \"Someone else\" to enter details manually"
          }
        </p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2">
        {!isAuthenticated && (
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-3 rounded-lg border border-purple-200 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-800">Premium Feature Preview</span>
              <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300 text-xs">
                Sign Up
              </Badge>
            </div>
            <p className="text-xs text-purple-700">
              Shop directly from your friends' wishlists and get AI recommendations based on their preferences!
            </p>
          </div>
        )}

        {displayConnections.length > 0 ? (
          <>
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">
                {isAuthenticated ? "Your Friends" : "Friend Shopping (Preview)"}
              </span>
              {!isAuthenticated && <Lock className="h-3 w-3 text-gray-400" />}
            </div>
            
            {displayConnections.map((connection) => {
              const friendName = isAuthenticated 
                ? `Friend ${connection.id.slice(0, 8)}`
                : connection.name;
              
              return (
                <Button
                  key={connection.id}
                  variant="outline"
                  className={`w-full justify-start p-3 h-auto relative ${
                    isAuthenticated 
                      ? "hover:bg-purple-50 hover:border-purple-300" 
                      : "opacity-60 cursor-not-allowed"
                  }`}
                  onClick={() => selectFriend({ id: connection.id, name: friendName })}
                  disabled={!isAuthenticated}
                >
                  <Avatar className="h-8 w-8 mr-3">
                    <AvatarFallback className="bg-purple-100 text-purple-600">
                      {friendName.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left flex-1">
                    <div className="font-medium">{friendName}</div>
                    <div className="text-xs text-gray-500">
                      {isAuthenticated 
                        ? "Has wishlist & preferences" 
                        : `${connection.hasWishlist ? 'Has wishlist' : 'No wishlist'} • AI preferences`
                      }
                    </div>
                  </div>
                  {!isAuthenticated && (
                    <div className="absolute top-2 right-2">
                      <Lock className="h-4 w-4 text-gray-400" />
                    </div>
                  )}
                </Button>
              );
            })}
          </>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">
              {isAuthenticated ? "No friends connected yet" : "Connect with friends to unlock this feature"}
            </p>
          </div>
        )}
      </div>

      <div className="border-t pt-4">
        <Button
          variant="outline"
          className="w-full justify-start p-3 h-auto hover:bg-gray-50"
          onClick={handleSomeoneElse}
        >
          <UserPlus className="h-5 w-5 mr-3 text-gray-500" />
          <div className="text-left">
            <div className="font-medium">Someone else</div>
            <div className="text-xs text-gray-500">Enter details manually</div>
          </div>
        </Button>
      </div>
    </div>
  );
};

export default RecipientSelectionStep;
