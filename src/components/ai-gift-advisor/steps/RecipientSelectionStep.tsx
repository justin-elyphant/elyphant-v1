
import React from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, UserPlus } from "lucide-react";
import { useGiftAdvisorBot } from "../hooks/useGiftAdvisorBot";

type RecipientSelectionStepProps = ReturnType<typeof useGiftAdvisorBot>;

const RecipientSelectionStep = ({ connections, selectFriend, nextStep }: RecipientSelectionStepProps) => {
  const handleSomeoneElse = () => {
    nextStep("manual-input");
  };

  return (
    <div className="flex flex-col h-full p-4 space-y-4">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold mb-2">Who are you shopping for?</h3>
        <p className="text-sm text-gray-600">
          Select a friend or choose "Someone else" to enter details manually.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2">
        {connections.length > 0 ? (
          <>
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Your Friends</span>
            </div>
            
            {connections.map((connection) => {
              // Mock friend data since we don't have profile data in connections yet
              const friendName = `Friend ${connection.id.slice(0, 8)}`;
              
              return (
                <Button
                  key={connection.id}
                  variant="outline"
                  className="w-full justify-start p-3 h-auto hover:bg-purple-50 hover:border-purple-300"
                  onClick={() => selectFriend({ id: connection.id, name: friendName })}
                >
                  <Avatar className="h-8 w-8 mr-3">
                    <AvatarFallback className="bg-purple-100 text-purple-600">
                      {friendName.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left">
                    <div className="font-medium">{friendName}</div>
                    <div className="text-xs text-gray-500">Has wishlist & preferences</div>
                  </div>
                </Button>
              );
            })}
          </>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No friends connected yet</p>
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
