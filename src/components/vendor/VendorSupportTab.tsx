
import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Filter,
  MessageSquare,
  FileUp,
  CheckCircle,
  XCircle,
  AlertCircle,
  Package,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

// Define support request type
interface SupportRequest {
  id: string;
  orderId: string;
  customerName: string;
  subject: string;
  status: string;
  hasReturn: boolean;
  dateCreated: string;
  lastMessage: string;
  lastMessageDate: string;
}

const VendorSupportTab = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<SupportRequest | null>(null);
  const [reply, setReply] = useState("");
  const [returnAction, setReturnAction] = useState("");
  const [returnReason, setReturnReason] = useState("");

  // Mock data for support requests
  const mockRequests: SupportRequest[] = [
    {
      id: "sup_123456",
      orderId: "ord_789012",
      customerName: "Jane Smith",
      subject: "Missing item in order",
      status: "pending_vendor",
      hasReturn: false,
      dateCreated: "2025-04-08T10:15:00Z",
      lastMessage: "Customer reports a Portable Charger was missing from their order. Can you confirm if this item was shipped?",
      lastMessageDate: "2025-04-08T11:35:00Z",
    },
    {
      id: "sup_123457",
      orderId: "ord_789013",
      customerName: "John Doe",
      subject: "Wrong size received",
      status: "pending_vendor",
      hasReturn: true,
      dateCreated: "2025-04-07T14:30:00Z",
      lastMessage: "Customer received size L but ordered size M. They would like to return it for the correct size.",
      lastMessageDate: "2025-04-07T15:20:00Z",
    },
    {
      id: "sup_123458",
      orderId: "ord_789014",
      customerName: "Alex Johnson",
      subject: "Damaged packaging",
      status: "in_progress",
      hasReturn: false,
      dateCreated: "2025-04-06T11:45:00Z",
      lastMessage: "Item was received with damaged packaging. Customer wants to know if this affects the product warranty.",
      lastMessageDate: "2025-04-06T13:10:00Z",
    },
  ];

  // Filter requests based on search term
  const filteredRequests = mockRequests.filter(
    (request) =>
      request.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Handle reply submission
  const handleSendReply = () => {
    if (!reply.trim() || !selectedRequest) return;

    toast.success("Reply sent", {
      description: `Your response to support request #${selectedRequest.id.slice(-6)} has been sent.`,
    });

    setReply("");
  };

  // Handle return authorization
  const handleReturnAuthorization = () => {
    if (!selectedRequest) return;

    if (returnAction === "approve") {
      toast.success("Return approved", {
        description: "The customer will be notified that their return has been approved.",
      });
    } else if (returnAction === "deny") {
      if (!returnReason.trim()) {
        toast.error("Reason required", {
          description: "Please provide a reason for denying the return.",
        });
        return;
      }

      toast.success("Return denied", {
        description: "The customer will be notified that their return has been denied.",
      });
    }

    setReturnAction("");
    setReturnReason("");
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending_vendor":
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Action Required</Badge>;
      case "in_progress":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">In Progress</Badge>;
      case "resolved":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Resolved</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Support & Returns</h2>
        <p className="text-muted-foreground">
          Manage customer support requests and returns for your products
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Support Requests</CardTitle>
          <CardDescription>
            Review and respond to customer support inquiries
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by order ID, customer, or subject..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>

          {filteredRequests.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Return</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">
                      #{request.orderId.slice(-6)}
                    </TableCell>
                    <TableCell>{request.customerName}</TableCell>
                    <TableCell>{request.subject}</TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell>
                      {request.hasReturn ? (
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                          Requested
                        </Badge>
                      ) : (
                        "None"
                      )}
                    </TableCell>
                    <TableCell>{formatDate(request.dateCreated)}</TableCell>
                    <TableCell className="text-right">
                      <Dialog onOpenChange={() => setSelectedRequest(request)}>
                        <DialogTrigger asChild>
                          <Button size="sm">
                            <MessageSquare className="h-4 w-4 mr-2" />
                            View & Reply
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl">
                          <DialogHeader>
                            <DialogTitle>Support Request #{request.id.slice(-6)}</DialogTitle>
                            <DialogDescription>
                              {request.subject} - Order #{request.orderId.slice(-6)}
                            </DialogDescription>
                          </DialogHeader>

                          <div className="space-y-6 py-4">
                            <div className="bg-muted p-4 rounded-md">
                              <div className="text-xs text-muted-foreground mb-1">
                                Most recent message from Elyphant Support ({formatDate(request.lastMessageDate)}):
                              </div>
                              <p className="text-sm">{request.lastMessage}</p>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="reply">Your Reply</Label>
                              <Textarea
                                id="reply"
                                placeholder="Type your response here..."
                                value={reply}
                                onChange={(e) => setReply(e.target.value)}
                                rows={4}
                              />
                            </div>

                            <div className="flex items-center gap-2">
                              <Label className="text-sm">Attachments (optional):</Label>
                              <Button variant="outline" size="sm">
                                <FileUp className="h-4 w-4 mr-2" />
                                Upload File
                              </Button>
                            </div>

                            {request.hasReturn && (
                              <div className="border-t pt-4 mt-4">
                                <h4 className="font-medium mb-3">Return Authorization</h4>
                                
                                <div className="flex flex-col gap-4">
                                  <div className="flex items-center gap-4">
                                    <Button 
                                      variant="outline" 
                                      className={returnAction === "approve" ? "bg-green-50 border-green-200" : ""} 
                                      onClick={() => setReturnAction("approve")}
                                    >
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Approve Return
                                    </Button>
                                    
                                    <Button 
                                      variant="outline" 
                                      className={returnAction === "deny" ? "bg-red-50 border-red-200" : ""} 
                                      onClick={() => setReturnAction("deny")}
                                    >
                                      <XCircle className="h-4 w-4 mr-2" />
                                      Deny Return
                                    </Button>
                                  </div>
                                  
                                  {returnAction === "deny" && (
                                    <div className="space-y-2">
                                      <Label htmlFor="return-reason">Reason for Denial (Required)</Label>
                                      <Textarea
                                        id="return-reason"
                                        placeholder="Explain why the return is being denied..."
                                        value={returnReason}
                                        onChange={(e) => setReturnReason(e.target.value)}
                                        rows={2}
                                      />
                                    </div>
                                  )}
                                  
                                  {returnAction && (
                                    <Button 
                                      onClick={handleReturnAuthorization}
                                      disabled={returnAction === "deny" && !returnReason.trim()}
                                    >
                                      Submit Return Decision
                                    </Button>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          <DialogFooter>
                            <DialogClose asChild>
                              <Button variant="outline">Cancel</Button>
                            </DialogClose>
                            <Button onClick={handleSendReply} disabled={!reply.trim()}>
                              Send Reply
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="border rounded-md p-8 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No support requests found. When customers have questions about your products, they'll appear here.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Return Metrics Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Return Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="text-3xl font-bold">2.7%</div>
              <Badge className="ml-2 bg-green-50 text-green-700 border-green-200">
                -0.5%
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Below marketplace average of 3.2%
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Pending Returns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">4</div>
            <p className="text-xs text-muted-foreground mt-1">
              Action required on 2 returns
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Avg. Response Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">8.5h</div>
            <p className="text-xs text-muted-foreground mt-1">
              Target: Under 12 hours
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Return Policies Card */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Return Policy Settings</CardTitle>
          <CardDescription>
            Customize your return policies and handling procedures
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="return-window">Return Window</Label>
                <Select defaultValue="30">
                  <SelectTrigger id="return-window">
                    <SelectValue placeholder="Select return window" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="14">14 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="60">60 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Time period during which customers can initiate returns
                </p>
              </div>
              
              <div>
                <Label htmlFor="return-condition">Return Condition Requirements</Label>
                <Select defaultValue="unused">
                  <SelectTrigger id="return-condition">
                    <SelectValue placeholder="Select condition requirements" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any condition</SelectItem>
                    <SelectItem value="good">Good condition</SelectItem>
                    <SelectItem value="unused">Unused with tags/packaging</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Required condition of items being returned
                </p>
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Automatically Approve Returns</Label>
                <Switch checked={false} />
              </div>
              <p className="text-xs text-muted-foreground">
                When enabled, returns meeting your policy requirements will be automatically approved
              </p>
            </div>
            
            <Button>
              Save Return Policy Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// A simple Switch component 
const Switch = ({ checked }: { checked: boolean }) => {
  return (
    <div className={`relative inline-block w-10 h-5 rounded-full ${checked ? 'bg-primary' : 'bg-gray-300'}`}>
      <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${checked ? 'translate-x-5' : ''}`}></div>
    </div>
  );
};

export default VendorSupportTab;
