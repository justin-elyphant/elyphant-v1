
export interface ScheduledGift {
  id: string;
  productName: string;
  productImage: string;
  recipientName: string;
  scheduledDate: Date;
  status: 'scheduled' | 'sent' | 'failed';
}
