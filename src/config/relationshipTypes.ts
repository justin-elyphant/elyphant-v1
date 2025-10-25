import { RelationshipType } from '@/types/connections';
import { 
  Heart, Users, Baby, User, Briefcase, 
  Home, UserCheck, Crown, GraduationCap
} from 'lucide-react';

export interface RelationshipOption {
  value: RelationshipType;
  label: string;
  icon: string;
}

export interface RelationshipCategory {
  label: string;
  types: RelationshipOption[];
}

export const RELATIONSHIP_CATEGORIES: Record<string, RelationshipCategory> = {
  family_parents: {
    label: 'Family - Parents',
    types: [
      { value: 'father', label: 'Father', icon: '👨' },
      { value: 'mother', label: 'Mother', icon: '👩' },
      { value: 'parent', label: 'Parent', icon: '👤' },
    ]
  },
  family_children: {
    label: 'Family - Children',
    types: [
      { value: 'son', label: 'Son', icon: '👦' },
      { value: 'daughter', label: 'Daughter', icon: '👧' },
      { value: 'child', label: 'Child', icon: '🧒' },
    ]
  },
  family_siblings: {
    label: 'Family - Siblings',
    types: [
      { value: 'brother', label: 'Brother', icon: '👨‍🦱' },
      { value: 'sister', label: 'Sister', icon: '👩‍🦰' },
      { value: 'sibling', label: 'Sibling', icon: '🧑' },
    ]
  },
  family_extended: {
    label: 'Family - Extended',
    types: [
      { value: 'uncle', label: 'Uncle', icon: '👨‍🦳' },
      { value: 'aunt', label: 'Aunt', icon: '👩‍🦳' },
      { value: 'cousin', label: 'Cousin', icon: '👥' },
      { value: 'nephew', label: 'Nephew', icon: '👦' },
      { value: 'niece', label: 'Niece', icon: '👧' },
      { value: 'grandfather', label: 'Grandfather', icon: '👴' },
      { value: 'grandmother', label: 'Grandmother', icon: '👵' },
      { value: 'grandparent', label: 'Grandparent', icon: '🧓' },
      { value: 'grandson', label: 'Grandson', icon: '👦' },
      { value: 'granddaughter', label: 'Granddaughter', icon: '👧' },
      { value: 'grandchild', label: 'Grandchild', icon: '🧒' },
    ]
  },
  romantic: {
    label: 'Romantic',
    types: [
      { value: 'spouse', label: 'Spouse', icon: '💑' },
      { value: 'partner', label: 'Partner', icon: '💕' },
      { value: 'fiancé', label: 'Fiancé', icon: '💍' },
      { value: 'fiancée', label: 'Fiancée', icon: '💍' },
      { value: 'boyfriend', label: 'Boyfriend', icon: '💙' },
      { value: 'girlfriend', label: 'Girlfriend', icon: '💗' },
    ]
  },
  social: {
    label: 'Friends & Social',
    types: [
      { value: 'friend', label: 'Friend', icon: '😊' },
      { value: 'best_friend', label: 'Best Friend', icon: '🤗' },
      { value: 'close_friend', label: 'Close Friend', icon: '🫂' },
      { value: 'neighbor', label: 'Neighbor', icon: '🏘️' },
    ]
  },
  professional: {
    label: 'Professional',
    types: [
      { value: 'colleague', label: 'Colleague', icon: '💼' },
      { value: 'coworker', label: 'Coworker', icon: '👔' },
      { value: 'boss', label: 'Boss', icon: '👔' },
      { value: 'mentor', label: 'Mentor', icon: '🎓' },
    ]
  },
  other: {
    label: 'Other',
    types: [
      { value: 'other', label: 'Other', icon: '👤' },
      { value: 'custom', label: 'Custom', icon: '✏️' },
    ]
  }
};

// Helper to get all relationship types as flat array
export const getAllRelationshipTypes = (): RelationshipOption[] => {
  return Object.values(RELATIONSHIP_CATEGORIES).flatMap(category => category.types);
};

// Helper to validate relationship type
export const isValidRelationshipType = (type: string): type is RelationshipType => {
  return getAllRelationshipTypes().some(option => option.value === type);
};

// Helper to get relationship category
export const getRelationshipCategory = (relationship: RelationshipType): string => {
  for (const [key, category] of Object.entries(RELATIONSHIP_CATEGORIES)) {
    if (category.types.some(type => type.value === relationship)) {
      return key;
    }
  }
  return 'other';
};

// Helper to get relationship display info
export const getRelationshipInfo = (relationship: RelationshipType): RelationshipOption | undefined => {
  return getAllRelationshipTypes().find(option => option.value === relationship);
};
