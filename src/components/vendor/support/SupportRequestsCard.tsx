
import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import SupportSearch from "./SupportSearch";
import SupportTable from "./SupportTable";
import EmptySupportState from "./EmptySupportState";
import RequestDetailsDialog from "./RequestDetailsDialog";
import { VendorSupportRequest } from "./types";

interface SupportRequestsCardProps {
  requests: VendorSupportRequest[];
}

const SupportRequestsCard: React.FC<SupportRequestsCardProps> = ({ requests }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<VendorSupportRequest | null>(null);

  // Filter requests based on search term
  const filteredRequests = requests.filter(
    (request) =>
      request.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Support Requests</CardTitle>
        <CardDescription>
          Review and respond to customer support inquiries
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SupportSearch 
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />
        
        {filteredRequests.length > 0 ? (
          <SupportTable 
            requests={filteredRequests} 
            onSelectRequest={setSelectedRequest}
          />
        ) : (
          <EmptySupportState />
        )}
        
        <Dialog open={selectedRequest !== null} onOpenChange={(open) => !open && setSelectedRequest(null)}>
          <RequestDetailsDialog request={selectedRequest} />
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default SupportRequestsCard;
