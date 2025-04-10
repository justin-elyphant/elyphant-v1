
import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MessageCircle } from "lucide-react";
import { Customer } from "./mockData";

interface CustomerHeaderProps {
  customer: Customer;
}

const CustomerHeader: React.FC<CustomerHeaderProps> = ({ customer }) => {
  return (
    <div className="flex justify-between items-start">
      <div className="flex items-center gap-4">
        <Avatar className="h-14 w-14">
          <AvatarImage src={customer.avatar} alt={customer.name} />
          <AvatarFallback>{customer.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
        </Avatar>
        <div>
          <h3 className="text-2xl font-semibold leading-none tracking-tight">{customer.name}</h3>
          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Mail className="h-3.5 w-3.5" />
              {customer.email}
            </div>
            <div className="flex items-center gap-1">
              <Phone className="h-3.5 w-3.5" />
              {customer.phone}
            </div>
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="outline">
          <MessageCircle className="h-4 w-4 mr-2" />
          Message
        </Button>
        <Button size="sm">
          <Phone className="h-4 w-4 mr-2" />
          Call
        </Button>
      </div>
    </div>
  );
};

export default CustomerHeader;
