
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { Customer } from "../mockData";

interface SupportTabProps {
  customer: Customer;
}

const SupportTab: React.FC<SupportTabProps> = ({ customer }) => {
  if (customer.supportRequests.length === 0) {
    return (
      <div className="border rounded-md p-8 text-center">
        <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No support requests found.</p>
        <Button className="mt-4" variant="outline" size="sm">
          Create Support Ticket
        </Button>
      </div>
    );
  }

  return (
    <div className="border rounded-md overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left px-4 py-3 font-medium">Ticket ID</th>
            <th className="text-left px-4 py-3 font-medium">Date</th>
            <th className="text-left px-4 py-3 font-medium">Subject</th>
            <th className="text-left px-4 py-3 font-medium">Status</th>
            <th className="text-right px-4 py-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {customer.supportRequests.map((request) => (
            <tr key={request.id} className="hover:bg-gray-50">
              <td className="px-4 py-3">{request.id}</td>
              <td className="px-4 py-3">{request.date}</td>
              <td className="px-4 py-3">{request.subject}</td>
              <td className="px-4 py-3">
                <Badge variant={
                  request.status === 'Resolved' ? 'default' : 
                  request.status === 'Open' ? 'default' : 'secondary'
                } className={request.status === 'Resolved' ? 'bg-green-500 hover:bg-green-600' : ''}>
                  {request.status}
                </Badge>
              </td>
              <td className="px-4 py-3 text-right">
                <Button variant="ghost" size="sm">View</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SupportTab;
