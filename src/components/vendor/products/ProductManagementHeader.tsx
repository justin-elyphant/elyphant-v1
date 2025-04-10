
import React from "react";
import { CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Download, Plus } from "lucide-react";

export const ProductManagementHeader = () => {
  return (
    <div className="flex justify-between items-center">
      <div>
        <CardTitle>Product Management</CardTitle>
        <CardDescription>Manage all products from connected vendors</CardDescription>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm">
          <Upload className="h-4 w-4 mr-1" />
          Import CSV
        </Button>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-1" />
          Export
        </Button>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Add Product
        </Button>
      </div>
    </div>
  );
};
