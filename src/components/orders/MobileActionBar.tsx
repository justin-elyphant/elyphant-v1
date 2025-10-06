import React from "react";
import { Button } from "@/components/ui/button";
import { MapPin, RotateCcw, Star } from "lucide-react";
import { ZincOrder } from "@/components/marketplace/zinc/types";

interface MobileActionBarProps {
  order: ZincOrder;
  onTrack?: () => void;
  onReorder?: () => void;
}

const MobileActionBar = ({ 
  order, 
  onTrack, 
  onReorder
}: MobileActionBarProps) => {
  return (
    <div className="floating-action-bar md:hidden">
      <div className="flex items-center gap-2 p-4">
        {order.status === "shipped" && (
          <Button 
            size="sm" 
            className="flex-1"
            onClick={onTrack}
          >
            <MapPin className="h-4 w-4 mr-2" />
            Track
          </Button>
        )}
        
        <Button 
          variant="outline" 
          size="sm"
          onClick={onReorder}
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default MobileActionBar;