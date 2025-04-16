
import React from "react";
import { CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Download, Plus, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export const ProductManagementHeader = () => {
  // Mock data - in a real app this would come from a context or API
  const productStats = {
    totalProducts: 8,
    freeListingsRemaining: 2,
    sponsoredProducts: 1
  };

  return (
    <div className="flex flex-col gap-4">
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
      
      <div className="flex items-center p-3 bg-blue-50 rounded-md">
        <div className="flex items-center gap-5 text-sm">
          <div>
            <span className="font-medium text-blue-700">Listed Products:</span> 
            <span className="ml-1 text-blue-600">{productStats.totalProducts}/10</span>
          </div>
          <div>
            <span className="font-medium text-blue-700">Free Listings Remaining:</span> 
            <span className="ml-1 text-blue-600">{productStats.freeListingsRemaining}</span>
          </div>
          <div>
            <span className="font-medium text-blue-700">Sponsored Products:</span> 
            <span className="ml-1 text-blue-600">{productStats.sponsoredProducts}</span>
          </div>
        </div>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 ml-2 text-blue-700 cursor-help" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Your first 10 product listings are free.<br />Additional listings require credits.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};
