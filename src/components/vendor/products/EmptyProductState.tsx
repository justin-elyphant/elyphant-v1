
import React from "react";
import { Button } from "@/components/ui/button";
import { Package } from "lucide-react";

export const EmptyProductState = () => {
  return (
    <div className="rounded-md border border-dashed p-8 text-center">
      <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
        <Package className="h-10 w-10 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">No products yet</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Add products manually or import from CSV to get started.
        </p>
        <div className="flex gap-3">
          <Button variant="outline">Import CSV</Button>
          <Button>Add Product</Button>
        </div>
      </div>
    </div>
  );
};
