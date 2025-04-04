
import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

interface TestPurchaseDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  testProductId: string;
  setTestProductId: (id: string) => void;
  isSimulatedTest: boolean;
  setIsSimulatedTest: (simulated: boolean) => void;
  isProcessing: boolean;
  onTestPurchase: () => void;
}

const TestPurchaseDialog = ({
  isOpen,
  onOpenChange,
  testProductId,
  setTestProductId,
  isSimulatedTest,
  setIsSimulatedTest,
  isProcessing,
  onTestPurchase
}: TestPurchaseDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Test Purchase</DialogTitle>
          <DialogDescription>
            This will process a test purchase using Amazon. No actual order will be placed.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="product-id">Amazon Product ID</Label>
            <Input
              id="product-id"
              placeholder="e.g., B01DFKC2SO"
              value={testProductId}
              onChange={(e) => setTestProductId(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Enter an Amazon ASIN (product ID). Default is B01DFKC2SO for Amazon Echo Dot.
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch 
              id="simulated-test" 
              checked={isSimulatedTest}
              onCheckedChange={setIsSimulatedTest}
            />
            <Label htmlFor="simulated-test">Fully simulate test (recommended)</Label>
          </div>
          <p className="text-xs text-muted-foreground">
            {isSimulatedTest ? 
              "This will simulate the entire order process, no real orders will be placed." : 
              "WARNING: Disabling simulation may attempt to place a real order on Amazon."}
          </p>
        </div>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button 
            onClick={onTestPurchase} 
            disabled={isProcessing || !testProductId.trim()}
          >
            {isProcessing ? "Processing..." : "Process Test Order"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TestPurchaseDialog;
