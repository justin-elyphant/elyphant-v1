
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/auth";
import { NicoleUnifiedInterface } from "@/components/ai/unified/NicoleUnifiedInterface";
import { LocalStorageService } from "@/services/localStorage/LocalStorageService";

const Hero = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showNicole, setShowNicole] = useState(false);

  useEffect(() => {
    // Set Nicole context for hero interactions
    LocalStorageService.setNicoleContext({
      source: 'hero_section',
      currentPage: '/',
      timestamp: new Date().toISOString()
    });
  }, []);

  const handleStartGifting = () => {
    if (user) {
      // Trigger Nicole with gifting context
      const event = new CustomEvent('triggerNicole', {
        detail: { 
          greeting: 'gift-finder',
          context: 'hero_cta',
          intent: 'find_gift'
        }
      });
      window.dispatchEvent(event);
    } else {
      navigate('/auth');
    }
  };

  const handleAutoGifting = () => {
    if (user) {
      // Trigger Nicole with auto-gifting context
      const event = new CustomEvent('triggerNicole', {
        detail: { 
          greeting: 'auto-gifting',
          context: 'hero_cta',
          intent: 'setup_auto_gifting'
        }
      });
      window.dispatchEvent(event);
    } else {
      navigate('/auth');
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700">
      {/* Background */}
      <div className="absolute inset-0 bg-black/20"></div>
      
      {/* Content */}
      <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 drop-shadow-lg">
          Never Miss Another Special Moment
        </h1>
        <p className="text-lg md:text-xl lg:text-2xl mb-8 drop-shadow-md opacity-90 max-w-3xl mx-auto">
          Discover thoughtful gifts and set up automatic gifting for birthdays, anniversaries, and holidays. 
          Make every occasion unforgettable.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
          <Button 
            size="lg" 
            className="text-lg px-8 py-6 bg-white/20 backdrop-blur-sm border-2 border-white/30 hover:bg-white/30 hover:border-white/50 text-white font-semibold min-w-[200px]"
            onClick={handleStartGifting}
          >
            Start Gifting
          </Button>
          <Button 
            size="lg" 
            variant="outline"
            className="text-lg px-8 py-6 bg-transparent border-2 border-white/50 hover:bg-white/10 text-white font-semibold min-w-[200px]"
            onClick={handleAutoGifting}
          >
            Auto-Gifting
          </Button>
        </div>

        <div className="text-sm opacity-75">
          {user ? "Ready to find the perfect gift?" : "Sign in to get started"}
        </div>
      </div>
    </div>
  );
};

export default Hero;
