
import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ZincOrder } from "@/components/marketplace/zinc/types";

interface ReturnItemsTableProps {
  order: ZincOrder;
  selectedItems: Record<string, boolean>;
  returnReasons: Record<string, string>;
  handleItemSelection: (index: string) => void;
  handleReasonChange: (index: string, reason: string) => void;
}

const ReturnItemsTable = ({
  order,
  selectedItems,
  returnReasons,
  handleItemSelection,
  handleReasonChange,
}: ReturnItemsTableProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[50px]">Return</TableHead>
          <TableHead>Product</TableHead>
          <TableHead>Quantity</TableHead>
          <TableHead>Price</TableHead>
          <TableHead>Reason</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {order.items?.map((item, index) => (
          <TableRow key={index}>
            <TableCell>
              <Checkbox
                checked={selectedItems[index.toString()]}
                onCheckedChange={() => handleItemSelection(index.toString())}
              />
            </TableCell>
            <TableCell className="font-medium">{item.name}</TableCell>
            <TableCell>{item.quantity}</TableCell>
            <TableCell>${item.price?.toFixed(2)}</TableCell>
            <TableCell>
              <Select
                disabled={!selectedItems[index.toString()]}
                value={returnReasons[index.toString()]}
                onValueChange={(value) => handleReasonChange(index.toString(), value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="defective">Defective product</SelectItem>
                  <SelectItem value="damaged">Damaged during shipping</SelectItem>
                  <SelectItem value="wrong">Wrong item received</SelectItem>
                  <SelectItem value="not_needed">No longer needed</SelectItem>
                  <SelectItem value="not_expected">Not as expected</SelectItem>
                  <SelectItem value="other">Other reason</SelectItem>
                </SelectContent>
              </Select>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default ReturnItemsTable;
