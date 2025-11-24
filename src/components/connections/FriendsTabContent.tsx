
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Connection, RelationshipType } from "@/types/connections";
import FriendCard from "./FriendCard";

interface FriendsTabContentProps {
  friends: Connection[];
  searchTerm: string;
  onRelationshipChange: (connectionId: string, newRelationship: RelationshipType, customValue?: string) => void;
  onAutoGiftToggle: (connectionId: string, enabled: boolean) => void;
  onConnectionClick?: (connection: Connection) => void;
}

const FriendsTabContent: React.FC<FriendsTabContentProps> = ({ 
  friends, 
  searchTerm, 
  onRelationshipChange,
  onAutoGiftToggle,
  onConnectionClick
}) => {
  if (friends.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium mb-2">No friends found</h3>
        <p className="text-muted-foreground mb-4">
          {searchTerm 
            ? `No results for "${searchTerm}"`
            : "You haven't added any friends yet"}
        </p>
        <Button asChild>
          <Link to="/connections?tab=suggestions">Find Friends</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {friends.map(friend => (
        <FriendCard
          key={friend.id}
          friend={friend}
          onRelationshipChange={onRelationshipChange}
          onAutoGiftToggle={onAutoGiftToggle}
          onCardClick={onConnectionClick}
        />
      ))}
    </div>
  );
};

export default FriendsTabContent;
