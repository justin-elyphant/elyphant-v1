import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  Gift, DollarSign, Star, ExternalLink, MessageSquare, 
  CheckCircle, XCircle, Clock, AlertTriangle 
} from "lucide-react";
import { format } from "date-fns";

interface Product {
  id: string;
  name: string;
  price: number;
  image?: string;
  rating?: number;
  description?: string;
  brand?: string;
  availability?: 'in_stock' | 'low_stock' | 'out_of_stock';
}

interface GiftApprovalSystemProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  execution: {
    id: string;
    event_type?: string;
    recipient_name?: string;
    execution_date: string;
    total_amount?: number;
    selected_products?: Product[];
  };
  onApprove: (executionId: string, selectedProductIds: string[], message?: string) => Promise<void>;
  onReject: (executionId: string, reason?: string) => Promise<void>;
}

const GiftApprovalSystem: React.FC<GiftApprovalSystemProps> = ({
  open,
  onOpenChange,
  execution,
  onApprove,
  onReject
}) => {
  const [selectedProducts, setSelectedProducts] = useState<string[]>(
    execution.selected_products?.map(p => p.id) || []
  );
  const [customMessage, setCustomMessage] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  const products = execution.selected_products || [];
  const selectedTotal = products
    .filter(p => selectedProducts.includes(p.id))
    .reduce((sum, p) => sum + p.price, 0);

  const handleProductToggle = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleApprove = async () => {
    if (selectedProducts.length === 0) {
      return;
    }

    setIsProcessing(true);
    try {
      await onApprove(execution.id, selectedProducts, customMessage || undefined);
      onOpenChange(false);
    } catch (error) {
      console.error('Error approving gifts:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    setIsProcessing(true);
    try {
      await onReject(execution.id, rejectReason || undefined);
      setShowRejectDialog(false);
      onOpenChange(false);
    } catch (error) {
      console.error('Error rejecting gifts:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const getAvailabilityBadge = (availability: string) => {
    switch (availability) {
      case 'in_stock':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">In Stock</Badge>;
      case 'low_stock':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Low Stock</Badge>;
      case 'out_of_stock':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">Out of Stock</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5" />
              Review Auto-Gift Suggestions
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Event Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Event Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Recipient:</span>
                    <p className="font-medium">{execution.recipient_name || 'Unknown'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Event:</span>
                    <p className="font-medium capitalize">{execution.event_type || 'Special Day'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Date:</span>
                    <p className="font-medium">{format(new Date(execution.execution_date), 'MMM d, yyyy')}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total Budget:</span>
                    <p className="font-medium">${execution.total_amount?.toFixed(2) || '0.00'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Product Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Suggested Gifts
                  <div className="text-sm font-normal text-muted-foreground">
                    {selectedProducts.length} of {products.length} selected • ${selectedTotal.toFixed(2)}
                  </div>
                </CardTitle>
                <CardDescription>
                  Review and select which gifts you'd like to purchase
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {products.map((product) => (
                    <div key={product.id} className="border rounded-lg p-4">
                      <div className="flex items-start gap-4">
                        <Checkbox
                          checked={selectedProducts.includes(product.id)}
                          onCheckedChange={() => handleProductToggle(product.id)}
                          className="mt-1"
                        />
                        
                        {product.image && (
                          <img 
                            src={product.image} 
                            alt={product.name}
                            className="w-16 h-16 object-cover rounded-md border"
                          />
                        )}
                        
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-medium">{product.name}</h4>
                              {product.brand && (
                                <p className="text-sm text-muted-foreground">{product.brand}</p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-lg">${product.price.toFixed(2)}</p>
                              {product.availability && getAvailabilityBadge(product.availability)}
                            </div>
                          </div>

                          {product.rating && (
                            <div className="flex items-center gap-1">
                              <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                  <Star 
                                    key={i} 
                                    className={`h-3 w-3 ${
                                      i < product.rating! ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                                    }`} 
                                  />
                                ))}
                              </div>
                              <span className="text-xs text-muted-foreground">
                                ({product.rating.toFixed(1)})
                              </span>
                            </div>
                          )}

                          {product.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {product.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Custom Message */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Gift Message (Optional)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Add a personal message to include with the gift(s)..."
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  maxLength={255}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  {customMessage.length}/255 characters
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setShowRejectDialog(true)}
              className="text-red-600 hover:text-red-700 hover:border-red-300"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject All
            </Button>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleApprove}
                disabled={selectedProducts.length === 0 || isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve & Purchase ({selectedProducts.length})
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              Reject Gift Suggestions
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-muted-foreground">
              Are you sure you want to reject all gift suggestions for this event? 
              You can optionally provide feedback to improve future suggestions.
            </p>

            <div>
              <Label htmlFor="rejectReason">Reason for rejection (optional)</Label>
              <Textarea
                id="rejectReason"
                placeholder="e.g., Budget too high, not suitable for recipient, prefer different style..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                maxLength={255}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleReject}
              disabled={isProcessing}
            >
              {isProcessing ? "Rejecting..." : "Reject All"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default GiftApprovalSystem;