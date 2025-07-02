
import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import AIEnhancedSearchBar from '@/components/search/AIEnhancedSearchBar';

const MobileSearchButton = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsSearchOpen(true)}
        className="p-2 hover:bg-gray-100 md:hidden"
        aria-label="Open search"
      >
        <Search className="h-5 w-5 text-gray-600" />
      </Button>

      <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
        <DialogContent className="sm:max-w-md p-0 gap-0">
          <DialogHeader className="p-4 pb-2">
            <DialogTitle className="text-lg font-semibold">Search</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <AIEnhancedSearchBar mobile={true} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MobileSearchButton;
