
import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  MessageSquare, 
  User, 
  Calendar,
  Package,
  RefreshCw,
  DollarSign,
  Send,
  PlusCircle
} from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

// Support note type
interface SupportNote {
  id: string;
  authorName: string;
  authorRole: 'cs_agent' | 'vendor' | 'system';
  content: string;
  timestamp: string;
  isInternal: boolean;
}

const SupportRequestDetail = () => {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const [newNote, setNewNote] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(true);
  const [vendorMessage, setVendorMessage] = useState('');
  const [selectedAction, setSelectedAction] = useState('');
  
  // Mock data for a support request
  const supportRequest = {
    id: requestId || 'sup_123456',
    orderId: 'ord_789012',
    customerName: 'Jane Smith',
    customerEmail: 'jane.smith@example.com',
    subject: 'Missing item in order',
    description: 'I received my order, but one of the items was missing from the package. The packing slip shows it should have been included.',
    status: 'in_progress',
    vendorName: 'Amazon via Zinc',
    createdAt: '2025-04-08T10:15:00Z',
    lastUpdated: '2025-04-08T15:30:00Z',
    orderTotal: 129.99,
    paymentMethod: 'Credit Card (**** 1234)',
    shippingAddress: '123 Main St, Apt 4B, San Diego, CA 92101',
    items: [
      { id: 'item_1', name: 'Wireless Headphones', price: 79.99, quantity: 1, status: 'delivered' },
      { id: 'item_2', name: 'Portable Charger', price: 29.99, quantity: 2, status: 'missing' }
    ]
  };
  
  // Mock data for support notes
  const [notes, setNotes] = useState<SupportNote[]>([
    {
      id: 'note_1',
      authorName: 'System',
      authorRole: 'system',
      content: 'Support request created',
      timestamp: '2025-04-08T10:15:00Z',
      isInternal: true
    },
    {
      id: 'note_2',
      authorName: 'Alex Rodriguez',
      authorRole: 'cs_agent',
      content: 'Called customer to confirm which item is missing. They reported the Portable Charger was not in the package.',
      timestamp: '2025-04-08T11:30:00Z',
      isInternal: true
    },
    {
      id: 'note_3',
      authorName: 'Alex Rodriguez',
      authorRole: 'cs_agent',
      content: 'Contacted vendor for information on missing item.',
      timestamp: '2025-04-08T11:35:00Z',
      isInternal: true
    },
    {
      id: 'note_4',
      authorName: 'Amazon Seller Support',
      authorRole: 'vendor',
      content: 'We show the item was included in the shipment. Checking with fulfillment center for more information.',
      timestamp: '2025-04-08T14:20:00Z',
      isInternal: false
    }
  ]);
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  // Add a new note
  const handleAddNote = () => {
    if (!newNote.trim()) return;
    
    const newNoteObj: SupportNote = {
      id: `note_${notes.length + 1}`,
      authorName: 'CS Agent',
      authorRole: 'cs_agent',
      content: newNote,
      timestamp: new Date().toISOString(),
      isInternal: isInternalNote
    };
    
    setNotes([...notes, newNoteObj]);
    setNewNote('');
    
    toast.success("Note added", {
      description: isInternalNote ? "Internal note added to the support request" : "Note added and visible to the customer"
    });
  };
  
  // Send a message to the vendor
  const handleSendToVendor = () => {
    if (!vendorMessage.trim()) return;
    
    const newVendorNoteObj: SupportNote = {
      id: `note_${notes.length + 1}`,
      authorName: 'CS Agent',
      authorRole: 'cs_agent',
      content: `Message to vendor: ${vendorMessage}`,
      timestamp: new Date().toISOString(),
      isInternal: true
    };
    
    setNotes([...notes, newVendorNoteObj]);
    setVendorMessage('');
    
    toast.success("Message sent to vendor", {
      description: `Message sent to ${supportRequest.vendorName}`
    });
  };
  
  // Handle status change
  const handleStatusChange = (newStatus: string) => {
    toast.success("Status updated", {
      description: `Support request status changed to ${newStatus.replace('_', ' ')}`
    });
  };
  
  // Handle support action
  const handleSupportAction = () => {
    if (!selectedAction) return;
    
    let actionMessage = '';
    let toastMessage = '';
    
    switch (selectedAction) {
      case 'refund':
        actionMessage = `Processed full refund of $${supportRequest.orderTotal.toFixed(2)} to original payment method`;
        toastMessage = "Refund processed successfully";
        break;
      case 'partial_refund':
        actionMessage = `Processed partial refund of $${(supportRequest.orderTotal / 2).toFixed(2)} to original payment method`;
        toastMessage = "Partial refund processed successfully";
        break;
      case 'store_credit':
        actionMessage = `Issued store credit of $${supportRequest.orderTotal.toFixed(2)} to customer account`;
        toastMessage = "Store credit issued successfully";
        break;
      case 'resend_gift':
        actionMessage = "Re-sent gift link to customer";
        toastMessage = "Gift link re-sent successfully";
        break;
      case 'resolve':
        actionMessage = "Marked support request as resolved";
        toastMessage = "Support request resolved";
        break;
    }
    
    // Add a new system note
    const newActionNote: SupportNote = {
      id: `note_${notes.length + 1}`,
      authorName: 'System',
      authorRole: 'system',
      content: actionMessage,
      timestamp: new Date().toISOString(),
      isInternal: true
    };
    
    setNotes([...notes, newActionNote]);
    setSelectedAction('');
    
    toast.success(toastMessage);
    
    if (selectedAction === 'resolve') {
      handleStatusChange('resolved');
    }
  };
  
  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <div className="mb-6">
        <Button variant="outline" onClick={() => navigate('/trunkline')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Support Requests
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column - Support Request Details */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Support Request #{requestId}</CardTitle>
                  <CardDescription>
                    {supportRequest.subject} - Order #{supportRequest.orderId.slice(-6)}
                  </CardDescription>
                </div>
                <Select defaultValue={supportRequest.status} onValueChange={handleStatusChange}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="vendor_action">Vendor Action</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="details">
                <TabsList className="mb-6">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="order">Order Items</TabsTrigger>
                  <TabsTrigger value="returns">Returns</TabsTrigger>
                </TabsList>
                
                <TabsContent value="details">
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-medium mb-2">Issue Description</h3>
                      <p className="text-sm text-muted-foreground p-4 bg-muted rounded-md">
                        {supportRequest.description}
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <h3 className="font-medium mb-2">Customer Information</h3>
                        <div className="space-y-2">
                          <div className="flex gap-2 items-center">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>{supportRequest.customerName}</span>
                          </div>
                          <div className="flex gap-2 items-center">
                            <MessageSquare className="h-4 w-4 text-muted-foreground" />
                            <span>{supportRequest.customerEmail}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="font-medium mb-2">Request Information</h3>
                        <div className="space-y-2">
                          <div className="flex gap-2 items-center">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>Created: {formatDate(supportRequest.createdAt)}</span>
                          </div>
                          <div className="flex gap-2 items-center">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            <span>Vendor: {supportRequest.vendorName}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="order">
                  <div className="space-y-4">
                    <div className="border rounded-md overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-muted">
                          <tr>
                            <th className="text-left p-3">Item</th>
                            <th className="text-center p-3">Quantity</th>
                            <th className="text-right p-3">Price</th>
                            <th className="text-right p-3">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {supportRequest.items.map(item => (
                            <tr key={item.id} className="border-t">
                              <td className="p-3">{item.name}</td>
                              <td className="p-3 text-center">{item.quantity}</td>
                              <td className="p-3 text-right">${item.price.toFixed(2)}</td>
                              <td className="p-3 text-right">
                                <Badge variant={item.status === 'delivered' ? 'outline' : 'destructive'}>
                                  {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="border-t">
                          <tr>
                            <td colSpan={2} className="p-3">
                              <span className="font-medium">Order Total</span>
                            </td>
                            <td colSpan={2} className="p-3 text-right">
                              <span className="font-medium">${supportRequest.orderTotal.toFixed(2)}</span>
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="font-medium mb-2">Payment Information</h3>
                        <p className="text-sm text-muted-foreground">
                          {supportRequest.paymentMethod}
                        </p>
                      </div>
                      
                      <div>
                        <h3 className="font-medium mb-2">Shipping Address</h3>
                        <p className="text-sm text-muted-foreground">
                          {supportRequest.shippingAddress}
                        </p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="returns">
                  <div className="border rounded-md p-8 text-center">
                    <RefreshCw className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No return requests associated with this order.</p>
                    <Button className="mt-4">
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Create Return Request
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          
          {/* Notes and Messages */}
          <Card>
            <CardHeader>
              <CardTitle>Support Notes & Communication</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mb-6">
                {notes.map((note) => (
                  <div key={note.id} className={`p-4 rounded-md ${
                    note.authorRole === 'system' ? 'bg-muted' :
                    note.authorRole === 'vendor' ? 'bg-blue-50' :
                    note.isInternal ? 'bg-yellow-50' : 'bg-green-50'
                  }`}>
                    <div className="flex justify-between mb-1">
                      <div className="font-medium flex items-center gap-2">
                        {note.authorRole === 'system' && <RefreshCw className="h-4 w-4" />}
                        {note.authorRole === 'vendor' && <Package className="h-4 w-4" />}
                        {note.authorRole === 'cs_agent' && <User className="h-4 w-4" />}
                        {note.authorName}
                        {note.isInternal && note.authorRole !== 'system' && (
                          <Badge variant="outline" className="text-xs">Internal</Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(note.timestamp)}
                      </div>
                    </div>
                    <p className="text-sm">{note.content}</p>
                  </div>
                ))}
              </div>
              
              {/* Add Note Form */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="new-note">Add Note</Label>
                  <Textarea
                    id="new-note"
                    placeholder="Add a note about this support request..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="mt-1"
                    rows={3}
                  />
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="internal-note"
                      checked={isInternalNote}
                      onChange={(e) => setIsInternalNote(e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor="internal-note" className="text-sm">Internal note (not visible to customer)</Label>
                  </div>
                  
                  <Button onClick={handleAddNote} disabled={!newNote.trim()}>
                    Add Note
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Right Column - Actions Panel */}
        <div className="space-y-6">
          {/* Vendor Communication */}
          <Card>
            <CardHeader>
              <CardTitle>Vendor Communication</CardTitle>
              <CardDescription>Send a message to {supportRequest.vendorName}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Textarea
                  placeholder="Type your message to the vendor..."
                  value={vendorMessage}
                  onChange={(e) => setVendorMessage(e.target.value)}
                  rows={4}
                />
                
                <Button 
                  className="w-full" 
                  onClick={handleSendToVendor}
                  disabled={!vendorMessage.trim()}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send to Vendor
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Support Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Support Actions</CardTitle>
              <CardDescription>Take action on this support request</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Select value={selectedAction} onValueChange={setSelectedAction}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="refund">
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-2" />
                        Issue Full Refund
                      </div>
                    </SelectItem>
                    <SelectItem value="partial_refund">
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-2" />
                        Issue Partial Refund
                      </div>
                    </SelectItem>
                    <SelectItem value="store_credit">
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-2" />
                        Issue Store Credit
                      </div>
                    </SelectItem>
                    <SelectItem value="resend_gift">
                      <div className="flex items-center">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Re-send Gift Link
                      </div>
                    </SelectItem>
                    <SelectItem value="resolve">
                      <div className="flex items-center">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Mark as Resolved
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                
                <Button 
                  className="w-full" 
                  onClick={handleSupportAction}
                  disabled={!selectedAction}
                >
                  Execute Action
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SupportRequestDetail;
