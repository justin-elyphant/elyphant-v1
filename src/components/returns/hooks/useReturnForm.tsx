
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { ZincOrder, ZincReturn } from "@/components/marketplace/zinc/types";
import { getMockReturns } from "@/components/marketplace/zinc/returnService";

export const useReturnForm = (orderId: string, order: ZincOrder | null) => {
  const navigate = useNavigate();
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({});
  const [returnReasons, setReturnReasons] = useState<Record<string, string>>({});
  const [existingReturns, setExistingReturns] = useState<ZincReturn[]>([]);

  // Initialize selected items state
  useEffect(() => {
    if (order?.items) {
      const initialSelectedItems: Record<string, boolean> = {};
      const initialReasons: Record<string, string> = {};
      
      order.items.forEach((_, index) => {
        initialSelectedItems[index.toString()] = false;
        initialReasons[index.toString()] = "";
      });
      
      setSelectedItems(initialSelectedItems);
      setReturnReasons(initialReasons);
    }
  }, [order]);

  // Check for existing returns
  useEffect(() => {
    if (orderId) {
      const returns = getMockReturns().filter(r => r.orderId === orderId || r.order_id === orderId);
      setExistingReturns(returns);
    }
  }, [orderId]);

  const handleItemSelection = (index: string) => {
    setSelectedItems(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handleReasonChange = (index: string, reason: string) => {
    setReturnReasons(prev => ({
      ...prev,
      [index]: reason
    }));
  };

  const handleSubmitReturn = () => {
    // Get selected items
    const itemsToReturn = Object.entries(selectedItems)
      .filter(([_, isSelected]) => isSelected)
      .map(([index]) => {
        const itemIndex = parseInt(index);
        return {
          ...order!.items![itemIndex],
          reason: returnReasons[index] || "Other"
        };
      });
    
    if (itemsToReturn.length === 0) {
      toast.error("Please select at least one item to return");
      return;
    }
    
    // Simulate API call to create return
    toast.loading("Processing your return request...");
    
    setTimeout(() => {
      toast.dismiss();
      toast.success("Return request submitted successfully");
      navigate("/orders");
    }, 1500);
  };

  return {
    selectedItems,
    returnReasons,
    existingReturns,
    handleItemSelection,
    handleReasonChange,
    handleSubmitReturn
  };
};
