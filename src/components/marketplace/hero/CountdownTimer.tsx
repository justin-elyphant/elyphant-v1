
import React from "react";
import { Clock } from "lucide-react";

interface CountdownTimerProps {
  targetDate: Date;
  eventName: string;
}

function getTimeParts(targetDate: Date) {
  const now = new Date();
  let diff = Math.max(0, Math.floor((targetDate.getTime() - now.getTime()) / 1000));
  const days = Math.floor(diff / (24 * 3600));
  diff -= days * 24 * 3600;
  const hours = Math.floor(diff / 3600);
  diff -= hours * 3600;
  const minutes = Math.floor(diff / 60);
  const seconds = diff - minutes * 60;
  return { days, hours, minutes, seconds };
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({ targetDate, eventName }) => {
  const [{ days, hours, minutes, seconds }, setTimeLeft] = React.useState(getTimeParts(targetDate));

  React.useEffect(() => {
    // Use a smoother interval for live ticking seconds (200ms)
    const timer = setInterval(() => {
      setTimeLeft(getTimeParts(targetDate));
    }, 200); // Update 5 times per second

    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <>
      <div className="flex items-center mb-6 justify-center md:justify-start">
        <Clock className="mr-2 h-5 w-5" />
        <span className="text-lg font-medium">Coming up in:</span>
      </div>
      <div className="flex space-x-3 mb-6 justify-center md:justify-start">
        <div className="bg-white/20 rounded-lg p-2 w-16 text-center">
          <div className="text-2xl font-bold">{days}</div>
          <div className="text-xs">Days</div>
        </div>
        <div className="bg-white/20 rounded-lg p-2 w-16 text-center">
          <div className="text-2xl font-bold">{hours}</div>
          <div className="text-xs">Hours</div>
        </div>
        <div className="bg-white/20 rounded-lg p-2 w-16 text-center">
          <div className="text-2xl font-bold">{minutes}</div>
          <div className="text-xs">Mins</div>
        </div>
        <div className="bg-white/20 rounded-lg p-2 w-16 text-center">
          <div className="text-2xl font-bold">{seconds}</div>
          <div className="text-xs">Secs</div>
        </div>
      </div>
    </>
  );
};

export default CountdownTimer;
