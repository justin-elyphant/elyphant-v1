import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Calendar } from 'lucide-react';
import Picker from 'react-mobile-picker';
import { toast } from 'sonner';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { PAYMENT_LEAD_TIME } from '@/lib/constants/paymentLeadTime';

interface DeliverySchedulingDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipientName: string;
  currentDate?: string | null;
  onDateUpdate: (date: string | null) => void;
}

const DeliverySchedulingDrawer: React.FC<DeliverySchedulingDrawerProps> = ({
  open,
  onOpenChange,
  recipientName,
  currentDate,
  onDateUpdate
}) => {
  // Generate month/day/year options
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear + 1].map(String);
  
  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Initialize from currentDate or default to 7 days from now
  const getInitialValues = () => {
    const date = currentDate ? new Date(currentDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    return {
      month: months[date.getMonth()],
      day: String(date.getDate()),
      year: String(date.getFullYear())
    };
  };

  const [pickerValue, setPickerValue] = useState(getInitialValues);

  // Update picker when drawer opens with new date
  useEffect(() => {
    if (open) {
      setPickerValue(getInitialValues());
    }
  }, [open, currentDate]);

  const selectedMonthIndex = months.indexOf(pickerValue.month);
  const daysInMonth = getDaysInMonth(selectedMonthIndex, parseInt(pickerValue.year));
  const days = Array.from({ length: daysInMonth }, (_, i) => String(i + 1));

  const handleSave = () => {
    const monthIndex = months.indexOf(pickerValue.month);
    const selectedDate = new Date(
      parseInt(pickerValue.year),
      monthIndex,
      parseInt(pickerValue.day)
    );
    
    // Enforce minimum lead time
    const minDate = new Date();
    minDate.setDate(minDate.getDate() + PAYMENT_LEAD_TIME.MIN_SCHEDULING_DAYS);
    minDate.setHours(0, 0, 0, 0);
    
    if (selectedDate < minDate) {
      toast.error(`Please select a date at least ${PAYMENT_LEAD_TIME.MIN_SCHEDULING_DAYS} days from now`);
      return;
    }
    
    // Format as YYYY-MM-DD
    const formattedDate = selectedDate.toISOString().split('T')[0];
    onDateUpdate(formattedDate);
  };

  const handleSendNow = () => {
    onDateUpdate(null);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange} modal={false}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <DrawerTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Schedule Delivery
            </DrawerTitle>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </DrawerClose>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Choose when {recipientName} should receive their gift
          </p>
        </DrawerHeader>

        <div className="p-4">
          {/* iOS-style Scroll Wheel Date Picker */}
        <div className="bg-muted/30 rounded-lg py-4">
            <Picker
              value={pickerValue}
              onChange={(value) => setPickerValue(value as { month: string; day: string; year: string })}
              wheelMode="natural"
              height={180}
            >
              <Picker.Column name="month">
                {months.map((month) => (
                  <Picker.Item key={month} value={month}>
                    {month}
                  </Picker.Item>
                ))}
              </Picker.Column>
              <Picker.Column name="day">
                {days.map((day) => (
                  <Picker.Item key={day} value={day}>
                    {day}
                  </Picker.Item>
                ))}
              </Picker.Column>
              <Picker.Column name="year">
                {years.map((year) => (
                  <Picker.Item key={year} value={year}>
                    {year}
                  </Picker.Item>
                ))}
              </Picker.Column>
            </Picker>
          </div>

          {/* Info text */}
          <p className="text-xs text-muted-foreground text-center mt-4">
            Gift will arrive on or before this date
          </p>
        </div>

        <DrawerFooter className="border-t pt-4">
          <div className="flex flex-col gap-2 w-full">
            <Button onClick={handleSave} className="w-full">
              Schedule for {pickerValue.month} {pickerValue.day}, {pickerValue.year}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handleSendNow}
              className="w-full"
            >
              Send Now (2-3 business days)
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default DeliverySchedulingDrawer;
