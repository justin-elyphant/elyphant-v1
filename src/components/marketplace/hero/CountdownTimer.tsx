
import React from "react";
import { Clock } from "lucide-react";
import { differenceInDays, differenceInHours, differenceInMinutes, differenceInSeconds } from "date-fns";

interface CountdownTimerProps {
  targetDate: Date;
  eventName: string;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({ targetDate, eventName }) => {
  const [timeLeft, setTimeLeft] = React.useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  // Update countdown timer
  React.useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      
      // Calculate the time difference
      const days = Math.max(0, differenceInDays(targetDate, now));
      const hours = Math.max(0, differenceInHours(targetDate, now) % 24);
      const minutes = Math.max(0, differenceInMinutes(targetDate, now) % 60);
      const seconds = Math.max(0, differenceInSeconds(targetDate, now) % 60);
      
      console.log("Countdown values:", { days, hours, minutes, seconds });
      setTimeLeft({ days, hours, minutes, seconds });
      
    }, 1000);
    
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
          <div className="text-2xl font-bold">{timeLeft.days}</div>
          <div className="text-xs">Days</div>
        </div>
        <div className="bg-white/20 rounded-lg p-2 w-16 text-center">
          <div className="text-2xl font-bold">{timeLeft.hours}</div>
          <div className="text-xs">Hours</div>
        </div>
        <div className="bg-white/20 rounded-lg p-2 w-16 text-center">
          <div className="text-2xl font-bold">{timeLeft.minutes}</div>
          <div className="text-xs">Mins</div>
        </div>
        <div className="bg-white/20 rounded-lg p-2 w-16 text-center">
          <div className="text-2xl font-bold">{timeLeft.seconds}</div>
          <div className="text-xs">Secs</div>
        </div>
      </div>
    </>
  );
};

export default CountdownTimer;
