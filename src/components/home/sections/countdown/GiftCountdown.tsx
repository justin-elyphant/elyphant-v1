
import React from 'react';
import { differenceInDays, differenceInHours, differenceInMinutes } from 'date-fns';

interface GiftCountdownProps {
  event: {
    name: string;
    date: Date;
  };
}

const GiftCountdown: React.FC<GiftCountdownProps> = ({ event }) => {
  const now = new Date();
  const days = differenceInDays(event.date, now);
  const hours = differenceInHours(event.date, now) % 24;
  const minutes = differenceInMinutes(event.date, now) % 60;

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-white border border-white/20">
      <h3 className="text-sm font-medium mb-2">{event.name} Countdown</h3>
      <div className="flex gap-4">
        <div>
          <span className="text-2xl font-bold">{days}</span>
          <span className="text-xs block">days</span>
        </div>
        <div>
          <span className="text-2xl font-bold">{hours}</span>
          <span className="text-xs block">hours</span>
        </div>
        <div>
          <span className="text-2xl font-bold">{minutes}</span>
          <span className="text-xs block">mins</span>
        </div>
      </div>
    </div>
  );
};

export default GiftCountdown;
