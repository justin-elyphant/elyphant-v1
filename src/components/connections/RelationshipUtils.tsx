
import { Heart, Users, Baby, Plus } from "lucide-react";
import { RelationshipType } from "@/types/connections";

export const getRelationshipIcon = (relationship: RelationshipType) => {
  switch (relationship) {
    case 'spouse':
      return <Heart className="h-4 w-4" />;
    case 'cousin':
      return <Users className="h-4 w-4" />;
    case 'child':
      return <Baby className="h-4 w-4" />;
    case 'custom':
      return <Plus className="h-4 w-4" />;
    case 'friend':
    default:
      return <Users className="h-4 w-4" />;
  }
};

export const getRelationshipLabel = (relationship: RelationshipType, custom?: string) => {
  if (relationship === 'custom' && custom) {
    return custom;
  }
  return relationship.charAt(0).toUpperCase() + relationship.slice(1);
};
