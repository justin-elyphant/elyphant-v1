
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { Gift, Clock } from "lucide-react";
import { Link } from "react-router-dom";

const MarketplaceHero = () => {
  const isMobile = useIsMobile();
  const [timeLeft, setTimeLeft] = useState({
    days: 3,
    hours: 8,
    minutes: 45,
    seconds: 30
  });
  
  // Update countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else if (prev.days > 0) {
          return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        }
        // Reset when timer ends
        return { days: 3, hours: 8, minutes: 45, seconds: 30 };
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  return (
    <div className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white mb-6">
      <div className="container mx-auto px-4 py-8">
        <div className={`${isMobile ? 'flex flex-col' : 'grid grid-cols-2 gap-8'} items-center`}>
          <div className={`${isMobile ? 'mb-6 text-center' : 'text-left'}`}>
            <h1 className="text-3xl font-bold mb-3">Holiday Gift Sale</h1>
            <p className="text-lg mb-4 opacity-90">Find the perfect gifts for everyone on your list with special discounts up to 40% off!</p>
            
            {/* Countdown timer */}
            <div className="flex items-center mb-6 justify-center md:justify-start">
              <Clock className="mr-2 h-5 w-5" />
              <span className="text-lg font-medium">Sale ends in:</span>
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
            
            <div className="flex space-x-4 justify-center md:justify-start">
              <Button className="bg-white text-purple-700 hover:bg-gray-100">
                <Gift className="mr-2 h-4 w-4" />
                Shop Now
              </Button>
              <Button variant="outline" className="border-white text-white hover:bg-white/20">
                View Deals
              </Button>
            </div>
          </div>
          
          <div className={`${isMobile ? 'text-center' : 'text-right'}`}>
            <img 
              src="https://images.unsplash.com/photo-1607083206968-13611e3d76db?q=80&w=1470&auto=format&fit=crop" 
              alt="Holiday gifts" 
              className="rounded-lg shadow-lg max-h-72 inline-block"
            />
          </div>
        </div>
        
        {/* Quick category links */}
        <div className="flex flex-wrap justify-center gap-3 mt-8">
          {['Electronics', 'Fashion', 'Home', 'Books', 'Toys'].map(category => (
            <Link 
              key={category} 
              to={`/marketplace?category=${category.toLowerCase()}`}
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-full text-sm font-medium transition-colors"
            >
              {category}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MarketplaceHero;
