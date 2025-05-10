
import React, { useState, useEffect } from 'react';
import { useAuth } from "@/contexts/auth";
import { Calendar } from "@/components/ui/calendar";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Calendar as CalendarIcon, Gift, Clock, User } from 'lucide-react';
import { format } from 'date-fns';

interface ScheduledGift {
  id: string;
  productName: string;
  productImage: string;
  recipientName: string;
  scheduledDate: Date;
  status: 'scheduled' | 'sent' | 'failed';
}

const DEMO_SCHEDULED_GIFTS: ScheduledGift[] = [
  {
    id: '1',
    productName: 'Leather Wallet',
    productImage: 'https://picsum.photos/200/300?random=1',
    recipientName: 'Alex Johnson',
    scheduledDate: new Date(2025, 11, 25), // Christmas 2025
    status: 'scheduled'
  },
  {
    id: '2',
    productName: 'Fitness Watch',
    productImage: 'https://picsum.photos/200/300?random=2',
    recipientName: 'Morgan Smith',
    scheduledDate: new Date(2025, 8, 15), // Sept 15, 2025
    status: 'sent'
  }
];

const GiftScheduling = () => {
  const { user } = useAuth();
  const [scheduledGifts, setScheduledGifts] = useState<ScheduledGift[]>(DEMO_SCHEDULED_GIFTS);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [recipientName, setRecipientName] = useState('');
  const [selectedTab, setSelectedTab] = useState('upcoming');
  
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
  
  const sortedGifts = [...scheduledGifts].sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime());
  
  const upcomingGifts = sortedGifts.filter(gift => gift.status === 'scheduled');
  const pastGifts = sortedGifts.filter(gift => gift.status !== 'scheduled');

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Gift Scheduling</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Gifts</CardTitle>
              <CardDescription>
                Manage your scheduled gift deliveries
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="upcoming">
                    Upcoming ({upcomingGifts.length})
                  </TabsTrigger>
                  <TabsTrigger value="history">
                    History ({pastGifts.length})
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="upcoming">
                  {upcomingGifts.length === 0 ? (
                    <div className="text-center py-8">
                      <Gift className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">No scheduled gifts</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {upcomingGifts.map((gift) => (
                        <Card key={gift.id}>
                          <CardContent className="p-4 flex flex-col sm:flex-row items-center sm:items-start gap-4">
                            <div className="w-16 h-16 rounded-md overflow-hidden bg-muted flex-shrink-0">
                              <img 
                                src={gift.productImage} 
                                alt={gift.productName}
                                className="w-full h-full object-cover" 
                              />
                            </div>
                            
                            <div className="flex-grow text-center sm:text-left">
                              <h4 className="font-medium">{gift.productName}</h4>
                              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-1 text-sm text-muted-foreground">
                                <div className="flex items-center justify-center sm:justify-start">
                                  <User className="h-3 w-3 mr-1" /> 
                                  <span>To: {gift.recipientName}</span>
                                </div>
                                <div className="flex items-center justify-center sm:justify-start">
                                  <CalendarIcon className="h-3 w-3 mr-1" />
                                  <span>{format(gift.scheduledDate, 'PPP')}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline">Edit</Button>
                              <Button size="sm" variant="destructive">Cancel</Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="history">
                  {pastGifts.length === 0 ? (
                    <div className="text-center py-8">
                      <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">No gift history</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pastGifts.map((gift) => (
                        <Card key={gift.id}>
                          <CardContent className="p-4 flex flex-col sm:flex-row items-center sm:items-start gap-4">
                            <div className="w-16 h-16 rounded-md overflow-hidden bg-muted flex-shrink-0">
                              <img 
                                src={gift.productImage} 
                                alt={gift.productName}
                                className="w-full h-full object-cover" 
                              />
                            </div>
                            
                            <div className="flex-grow text-center sm:text-left">
                              <h4 className="font-medium">{gift.productName}</h4>
                              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-1 text-sm text-muted-foreground">
                                <div className="flex items-center justify-center sm:justify-start">
                                  <User className="h-3 w-3 mr-1" /> 
                                  <span>To: {gift.recipientName}</span>
                                </div>
                                <div className="flex items-center justify-center sm:justify-start">
                                  <CalendarIcon className="h-3 w-3 mr-1" />
                                  <span>{format(gift.scheduledDate, 'PPP')}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div>
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                gift.status === 'sent' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {gift.status === 'sent' ? 'Sent' : 'Failed'}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
        
        <div>
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
                      <SelectItem value="Alex Johnson">Alex Johnson</SelectItem>
                      <SelectItem value="Morgan Smith">Morgan Smith</SelectItem>
                      <SelectItem value="Jamie Williams">Jamie Williams</SelectItem>
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
        </div>
      </div>
    </div>
  );
};

export default GiftScheduling;
