
import React, { useState } from "react";
import { Gift, Square, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import EnhancedWishlistCard from "@/components/gifting/wishlist/EnhancedWishlistCard";
import BulkActionBar from "@/components/gifting/wishlist/BulkActionBar";
import GiftSchedulingModal from "@/components/gifting/wishlist/GiftSchedulingModal";
import { WishlistItem } from "@/types/profile";

interface WishlistItemsGridProps {
  items: WishlistItem[];
  onSaveItem: (item: WishlistItem) => void;
  savingItemId: string | null;
  onGiftNow?: (item: WishlistItem) => void;
}

const WishlistItemsGrid = ({ items, onSaveItem, savingItemId, onGiftNow }: WishlistItemsGridProps) => {
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showSchedulingModal, setShowSchedulingModal] = useState(false);
  const [itemsToSchedule, setItemsToSchedule] = useState<WishlistItem[]>([]);

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
      <div className="text-center py-8">
        <Gift className="h-12 w-12 mx-auto text-gray-300 mb-2" />
        <p className="text-muted-foreground">This wishlist is empty.</p>
      </div>
    );
  }

  return (
    <>
      {/* Selection Mode Toggle */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">
            {items.length} item{items.length > 1 ? 's' : ''}
          </h3>
          {isSelectionMode && (
            <span className="text-sm text-muted-foreground">
              {selectedItems.size} selected
            </span>
          )}
        </div>
        
        <Button
          variant={isSelectionMode ? "outline" : "secondary"}
          size="sm"
          onClick={isSelectionMode ? handleClearSelection : handleEnterSelectionMode}
          className="flex items-center gap-2"
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
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <EnhancedWishlistCard
            key={item.id}
            item={item}
            onRemove={() => onSaveItem(item)}
            isRemoving={savingItemId === item.id}
            onGiftNow={onGiftNow}
            onScheduleGift={handleSingleSchedule}
            isSelectionMode={isSelectionMode}
            isSelected={selectedItems.has(item.id)}
            onSelectionChange={handleSelectionChange}
          />
        ))}
      </div>

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
