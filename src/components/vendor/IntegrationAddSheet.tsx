
import React from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Plus, ChevronRight } from "lucide-react";

const IntegrationAddSheet = () => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add New Integration
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Add New Integration</SheetTitle>
          <SheetDescription>
            Connect a new vendor or platform to your marketplace
          </SheetDescription>
        </SheetHeader>
        <div className="py-6 space-y-4">
          <Button variant="outline" className="w-full justify-between">
            Shopify Store <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" className="w-full justify-between">
            Direct API <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" className="w-full justify-between">
            Manual Upload <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" className="w-full justify-between">
            Other Integration <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default IntegrationAddSheet;
