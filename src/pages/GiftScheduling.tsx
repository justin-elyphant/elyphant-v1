
import React, { useState } from 'react';
import { useAuth } from "@/contexts/auth";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { ScheduledGift } from "@/types/gift-scheduling";
import GiftSchedulingTabs from "@/components/gift-scheduling/GiftSchedulingTabs";
import ScheduleGiftForm from "@/components/gift-scheduling/ScheduleGiftForm";

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

const DEMO_RECIPIENTS = [
  "Alex Johnson",
  "Morgan Smith",
  "Jamie Williams"
];

const GiftScheduling = () => {
  const { user } = useAuth();
  const [scheduledGifts] = useState<ScheduledGift[]>(DEMO_SCHEDULED_GIFTS);
  const [selectedTab, setSelectedTab] = useState('upcoming');
  
  // Sort and filter gifts
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
              <GiftSchedulingTabs 
                upcomingGifts={upcomingGifts}
                pastGifts={pastGifts}
                selectedTab={selectedTab}
                setSelectedTab={setSelectedTab}
              />
            </CardContent>
          </Card>
        </div>
        
        <div>
          <ScheduleGiftForm recipients={DEMO_RECIPIENTS} />
        </div>
      </div>
    </div>
  );
};

export default GiftScheduling;
