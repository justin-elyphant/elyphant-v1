
import React from "react";
import { CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Download, Plus, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useVendorProducts } from "@/hooks/vendor/useVendorProducts";

interface ProductManagementHeaderProps {
  onAddProduct?: () => void;
  onImportCSV?: () => void;
}

export const ProductManagementHeader = ({ onAddProduct, onImportCSV }: ProductManagementHeaderProps) => {
  const { data: products } = useVendorProducts();
  const totalProducts = products?.length ?? 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <div>
          <CardTitle>Product Management</CardTitle>
          <CardDescription>Manage all products from connected vendors</CardDescription>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onImportCSV}>
            <Upload className="h-4 w-4 mr-1" />
            Import CSV
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
          <Button size="sm" onClick={onAddProduct}>
            <Plus className="h-4 w-4 mr-1" />
            Add Product
          </Button>
        </div>
      </div>
      
      <div className="flex items-center p-3 bg-muted rounded-md">
        <div className="flex items-center gap-5 text-sm">
          <div>
            <span className="font-medium text-foreground">Listed Products:</span> 
            <span className="ml-1 text-muted-foreground">{totalProducts}</span>
          </div>
          <div>
            <span className="font-medium text-foreground">Free Listings:</span> 
            <span className="ml-1 text-muted-foreground">Unlimited</span>
          </div>
        </div>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 ml-2 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent>
              <p>All product listings are free. Revenue is generated via 30% markup on sales.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};
