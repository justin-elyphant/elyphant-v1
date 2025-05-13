
import React from 'react';
import { format } from 'date-fns';
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";

interface ScheduleGiftFormProps {
  recipients: string[];
}

const ScheduleGiftForm: React.FC<ScheduleGiftFormProps> = ({ recipients }) => {
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const [recipientName, setRecipientName] = React.useState('');
  
  const handleScheduleGift = () => {
    if (!date || !recipientName) {
      toast.error("Please select a date and recipient");
      return;
    }
    
    // In a real app, this would connect to backend services
    toast.success(`Gift scheduled for ${recipientName} on ${format(date, 'PPP')}`);
    
    // Reset form
    setDate(new Date());
    setRecipientName('');
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Schedule a Gift</CardTitle>
        <CardDescription>
          Choose when to deliver your gift
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recipient">Recipient</Label>
            <Select value={recipientName} onValueChange={setRecipientName}>
              <SelectTrigger id="recipient">
                <SelectValue placeholder="Select recipient" />
              </SelectTrigger>
              <SelectContent>
                {recipients.map((recipient) => (
                  <SelectItem key={recipient} value={recipient}>{recipient}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Delivery Date</Label>
            <div className="border rounded-md p-1">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                disabled={(date) => date < new Date()}
                className="mx-auto"
              />
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full"
          onClick={handleScheduleGift}
        >
          Schedule Gift
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ScheduleGiftForm;
