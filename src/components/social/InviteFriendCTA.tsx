import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Heart, UserPlus, Sparkles } from "lucide-react";
import { AddConnectionSheet } from "@/components/connections/AddConnectionSheet";

const InviteFriendCTA = () => {
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <>
      <div className="p-4 sm:p-6 border rounded-lg bg-gradient-to-r from-purple-100 via-pink-100 to-rose-100 dark:from-purple-900/30 dark:via-pink-900/30 dark:to-rose-900/30 shadow-lg relative overflow-hidden">
        {/* Animated background effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-pink-500/5 to-rose-500/5 animate-pulse"></div>
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
          <div className="flex-1">
            <h4 className="font-semibold flex items-center">
              <Heart className="h-5 w-5 mr-2 text-pink-600 dark:text-pink-400" />
              <span className="bg-gradient-to-r from-purple-700 to-rose-700 bg-clip-text text-transparent">
                Invite a Friend
              </span>
            </h4>
            <p className="text-sm text-muted-foreground mt-1">
              Help a friend build their wishlist and discover gifts they'll love
            </p>
          </div>
          <Button 
            onClick={() => setSheetOpen(true)}
            className="bg-gradient-to-r from-purple-600 to-rose-600 hover:from-purple-700 hover:to-rose-700 text-white border-0 shadow-md h-10 sm:h-9 w-full sm:w-auto flex items-center gap-2"
            size="sm"
          >
            <UserPlus className="h-4 w-4" />
            <span>Add Friend</span>
            <Sparkles className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <AddConnectionSheet 
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
      />
    </>
  );
};

export default InviteFriendCTA;
