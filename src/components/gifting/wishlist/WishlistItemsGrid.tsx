
import React, { useState, useMemo } from "react";
import { Gift, Square, CheckSquare, LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import EnhancedWishlistCard from "@/components/gifting/wishlist/EnhancedWishlistCard";
import BulkActionBar from "@/components/gifting/wishlist/BulkActionBar";
import GiftSchedulingModal from "@/components/gifting/wishlist/GiftSchedulingModal";
import CategorySection from "./workspace/CategorySection";
import { WishlistItem } from "@/types/profile";

interface WishlistItemsGridProps {
  items: WishlistItem[];
  onSaveItem: (item: WishlistItem) => void;
  savingItemId?: string | null;
  onGiftNow?: (item: WishlistItem) => void;
  isOwner?: boolean;
  isGuestPreview?: boolean;
}

const WishlistItemsGrid = ({ items, onSaveItem, savingItemId, onGiftNow, isOwner = true, isGuestPreview = false }: WishlistItemsGridProps) => {
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showSchedulingModal, setShowSchedulingModal] = useState(false);
  const [itemsToSchedule, setItemsToSchedule] = useState<WishlistItem[]>([]);
  const [viewMode, setViewMode] = useState<'flat' | 'grouped'>('grouped');

  // Group items by category/brand
  const groupedItems = useMemo(() => {
    const groups = new Map<string, WishlistItem[]>();
    
    items.forEach(item => {
      const category = item.brand || 'Other';
      if (!groups.has(category)) {
        groups.set(category, []);
      }
      groups.get(category)!.push(item);
    });
    
    // Sort categories by item count (descending)
    return Array.from(groups.entries())
      .sort((a, b) => b[1].length - a[1].length);
  }, [items]);

  const handleSelectionChange = (itemId: string, selected: boolean) => {
    const newSelected = new Set(selectedItems);
    if (selected) {
      newSelected.add(itemId);
    } else {
      newSelected.delete(itemId);
    }
    setSelectedItems(newSelected);
    
    // Auto-exit selection mode if no items selected
    if (newSelected.size === 0) {
      setIsSelectionMode(false);
    }
  };

  const handleEnterSelectionMode = () => {
    setIsSelectionMode(true);
    setSelectedItems(new Set());
  };

  const handleClearSelection = () => {
    setSelectedItems(new Set());
    setIsSelectionMode(false);
  };

  const getSelectedItemObjects = () => {
    return items.filter(item => selectedItems.has(item.id));
  };

  const handleBulkGift = (selectedItemsList: WishlistItem[]) => {
    // TODO: Implement bulk gifting logic
    console.log('Bulk gifting:', selectedItemsList);
    handleClearSelection();
  };

  const handleBulkSchedule = (selectedItemsList: WishlistItem[]) => {
    setItemsToSchedule(selectedItemsList);
    setShowSchedulingModal(true);
  };

  const handleSingleSchedule = (item: WishlistItem) => {
    setItemsToSchedule([item]);
    setShowSchedulingModal(true);
  };

  const handleBulkRemove = (selectedItemsList: WishlistItem[]) => {
    // Remove all selected items
    selectedItemsList.forEach(item => onSaveItem(item));
    handleClearSelection();
  };

  const handleScheduleSubmit = (scheduleData: any) => {
    // TODO: Implement actual scheduling logic with backend
    console.log('Scheduling gifts:', scheduleData);
    setShowSchedulingModal(false);
    setItemsToSchedule([]);
    handleClearSelection();
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="bg-muted/50 p-8 rounded-full mb-6">
          <Gift className="h-16 w-16 text-muted-foreground" />
        </div>
        <h3 className="text-2xl font-semibold mb-3">Your wishlist is empty</h3>
        <p className="text-muted-foreground text-center max-w-md mb-8 text-lg">
          Start adding items to build your perfect wishlist. Browse products or search for what you love.
        </p>
        {isOwner && !isGuestPreview && (
          <div className="flex gap-3">
            <Button size="lg" onClick={() => window.history.back()}>
              Browse Products
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      {/* Header with View Toggle */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <h3 className="text-2xl font-bold">
            {items.length} item{items.length > 1 ? 's' : ''}
          </h3>
          {isSelectionMode && (
            <span className="text-sm text-muted-foreground">
              ({selectedItems.size} selected)
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          {items.length > 0 && !isSelectionMode && (
            <div className="flex items-center gap-1 border border-border rounded-lg p-1">
              <Button
                variant={viewMode === 'grouped' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grouped')}
                className="gap-2"
              >
                <LayoutGrid className="h-4 w-4" />
                By Category
              </Button>
              <Button
                variant={viewMode === 'flat' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('flat')}
                className="gap-2"
              >
                <List className="h-4 w-4" />
                All Items
              </Button>
            </div>
          )}
          
          {/* Selection Mode Toggle */}
          {isOwner && !isGuestPreview && items.length > 0 && (
            <Button
              variant={isSelectionMode ? "default" : "outline"}
              size="sm"
              onClick={() => isSelectionMode ? handleClearSelection() : handleEnterSelectionMode()}
              className="gap-2"
            >
              {isSelectionMode ? (
                <>
                  <CheckSquare className="h-4 w-4" />
                  Cancel Selection
                </>
              ) : (
                <>
                  <Square className="h-4 w-4" />
                  Select Items
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Items Display - Grouped or Flat */}
      {viewMode === 'grouped' ? (
        // Category-Grouped Display
        <div className="space-y-12">
          {groupedItems.map(([category, categoryItems]) => (
            <CategorySection
              key={category}
              category={category}
              items={categoryItems}
              onRemove={onSaveItem}
              savingItemId={savingItemId}
              onGiftNow={onGiftNow}
              onScheduleGift={handleSingleSchedule}
              isOwner={isOwner}
              isGuestPreview={isGuestPreview}
            />
          ))}
        </div>
      ) : (
        // Flat Grid Display
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <EnhancedWishlistCard
              key={item.id}
              item={item}
              onRemove={isOwner && !isGuestPreview ? () => onSaveItem(item) : undefined}
              isRemoving={savingItemId === item.id}
              onGiftNow={onGiftNow}
              onScheduleGift={handleSingleSchedule}
              isSelectionMode={isSelectionMode}
              isSelected={selectedItems.has(item.id)}
              onSelectionChange={handleSelectionChange}
              className="min-h-[320px]"
            />
          ))}
        </div>
      )}

      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedItems={getSelectedItemObjects()}
        onClearSelection={handleClearSelection}
        onBulkGift={handleBulkGift}
        onBulkSchedule={handleBulkSchedule}
        onBulkRemove={handleBulkRemove}
      />

      {/* Gift Scheduling Modal */}
      <GiftSchedulingModal
        isOpen={showSchedulingModal}
        onClose={() => {
          setShowSchedulingModal(false);
          setItemsToSchedule([]);
        }}
        items={itemsToSchedule}
        onSchedule={handleScheduleSubmit}
      />
    </>
  );
};

export default WishlistItemsGrid;
