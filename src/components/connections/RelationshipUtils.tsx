
import { Heart, Users, Baby, Plus, User, Briefcase, Home } from "lucide-react";
import { RelationshipType } from "@/types/connections";
import { getRelationshipInfo, getRelationshipCategory } from "@/config/relationshipTypes";

export const getRelationshipIcon = (relationship: RelationshipType) => {
  const category = getRelationshipCategory(relationship);
  
  // Icon mapping based on category
  switch (category) {
    case 'family_parents':
    case 'family_children':
    case 'family_siblings':
    case 'family_extended':
      return <Users className="h-4 w-4" />;
    case 'romantic':
      return <Heart className="h-4 w-4" />;
    case 'professional':
      return <Briefcase className="h-4 w-4" />;
    case 'social':
      return <Users className="h-4 w-4" />;
    case 'other':
      return relationship === 'custom' ? <Plus className="h-4 w-4" /> : <User className="h-4 w-4" />;
    default:
      return <Users className="h-4 w-4" />;
  }
};

export const getRelationshipLabel = (relationship: RelationshipType, custom?: string) => {
  if (relationship === 'custom' && custom) {
    return custom;
  }
  
  const info = getRelationshipInfo(relationship);
  return info?.label || relationship.charAt(0).toUpperCase() + relationship.slice(1);
};

export const getRelationshipEmoji = (relationship: RelationshipType): string => {
  const info = getRelationshipInfo(relationship);
  return info?.icon || '👤';
};
