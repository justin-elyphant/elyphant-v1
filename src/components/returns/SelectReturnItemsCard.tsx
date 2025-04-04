
import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import ReturnItemsTable from "./ReturnItemsTable";
import { ZincOrder } from "@/components/marketplace/zinc/types";

interface SelectReturnItemsCardProps {
  order: ZincOrder;
  selectedItems: Record<string, boolean>;
  returnReasons: Record<string, string>;
  handleItemSelection: (index: string) => void;
  handleReasonChange: (index: string, reason: string) => void;
}

const SelectReturnItemsCard = ({
  order,
  selectedItems,
  returnReasons,
  handleItemSelection,
  handleReasonChange,
}: SelectReturnItemsCardProps) => {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Select Items to Return</CardTitle>
        <CardDescription>
          Choose which items you want to return and select a reason
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ReturnItemsTable
          order={order}
          selectedItems={selectedItems}
          returnReasons={returnReasons}
          handleItemSelection={handleItemSelection}
          handleReasonChange={handleReasonChange}
        />
      </CardContent>
    </Card>
  );
};

export default SelectReturnItemsCard;
