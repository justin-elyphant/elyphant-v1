import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'trunkline-dashboard-layout';

export interface DashboardSection {
  id: string;
  title: string;
  cards: string[];
}

const DEFAULT_LAYOUT: DashboardSection[] = [
  { id: 'revenue-metrics', title: 'Revenue Metrics', cards: ['net-revenue', 'gmv', 'gross-profit', 'take-rate'] },
  { id: 'secondary-metrics', title: 'Secondary Metrics', cards: ['total-orders', 'customers', 'pending-orders'] },
  { id: 'quick-stats', title: 'Quick Stats', cards: ['order-status', 'revenue-breakdown'] },
  { id: 'future-revenue', title: 'Future Revenue Streams', cards: ['subscription', 'commissions'] },
  { id: 'recent-activity', title: 'Recent Activity', cards: ['recent-orders'] },
];

export function useDashboardLayout() {
  const [sections, setSections] = useState<DashboardSection[]>(DEFAULT_LAYOUT);
  const [isEditing, setIsEditing] = useState(false);

  // Load layout from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Validate structure
        if (Array.isArray(parsed) && parsed.every(s => s.id && s.title && Array.isArray(s.cards))) {
          setSections(parsed);
        }
      }
    } catch (error) {
      console.error('Failed to load dashboard layout:', error);
    }
  }, []);

  // Save layout to localStorage
  const saveLayout = useCallback((newSections: DashboardSection[]) => {
    setSections(newSections);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSections));
    } catch (error) {
      console.error('Failed to save dashboard layout:', error);
    }
  }, []);

  // Reorder sections
  const reorderSections = useCallback((activeId: string, overId: string) => {
    setSections(prev => {
      const oldIndex = prev.findIndex(s => s.id === activeId);
      const newIndex = prev.findIndex(s => s.id === overId);
      
      if (oldIndex === -1 || newIndex === -1) return prev;
      
      const newSections = [...prev];
      const [removed] = newSections.splice(oldIndex, 1);
      newSections.splice(newIndex, 0, removed);
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSections));
      return newSections;
    });
  }, []);

  // Reorder cards within a section
  const reorderCards = useCallback((sectionId: string, activeId: string, overId: string) => {
    setSections(prev => {
      const sectionIndex = prev.findIndex(s => s.id === sectionId);
      if (sectionIndex === -1) return prev;
      
      const section = prev[sectionIndex];
      const oldIndex = section.cards.indexOf(activeId);
      const newIndex = section.cards.indexOf(overId);
      
      if (oldIndex === -1 || newIndex === -1) return prev;
      
      const newCards = [...section.cards];
      const [removed] = newCards.splice(oldIndex, 1);
      newCards.splice(newIndex, 0, removed);
      
      const newSections = [...prev];
      newSections[sectionIndex] = { ...section, cards: newCards };
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSections));
      return newSections;
    });
  }, []);

  // Reset to default layout
  const resetLayout = useCallback(() => {
    setSections(DEFAULT_LAYOUT);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    sections,
    isEditing,
    setIsEditing,
    reorderSections,
    reorderCards,
    resetLayout,
    saveLayout,
  };
}
