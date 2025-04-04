
import React, { useState, useMemo } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { ZincOrder } from "@/components/marketplace/zinc/types";

export const useOrderSort = (orders: ZincOrder[]) => {
  const [sortField, setSortField] = useState<string>("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? 
      <ArrowUp className="ml-1 h-3 w-3 inline" /> : 
      <ArrowDown className="ml-1 h-3 w-3 inline" />;
  };

  const sortedOrders = useMemo(() => {
    return [...orders].sort((a, b) => {
      if (sortField === "date") {
        const dateA = new Date(a.date || "").getTime();
        const dateB = new Date(b.date || "").getTime();
        return sortDirection === "asc" ? dateA - dateB : dateB - dateA;
      } else if (sortField === "status") {
        const statusA = a.status || "";
        const statusB = b.status || "";
        return sortDirection === "asc" 
          ? statusA.localeCompare(statusB) 
          : statusB.localeCompare(statusA);
      } else if (sortField === "total") {
        const totalA = a.total || 0;
        const totalB = b.total || 0;
        return sortDirection === "asc" ? totalA - totalB : totalB - totalA;
      }
      return 0;
    });
  }, [orders, sortField, sortDirection]);

  return {
    sortField,
    sortDirection,
    handleSort,
    getSortIcon,
    sortedOrders
  };
};
