import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Gift, Sparkles, Clock, Heart } from "lucide-react";
import { useAuth } from "@/contexts/auth";
import { useProfile } from "@/contexts/profile/ProfileContext";
import { LocalStorageService } from "@/utils/localStorageService";
import CountdownTimer from "./components/CountdownTimer";
import IntentSelectionModal from "./components/IntentSelectionModal";
import HeroBackground from "./components/HeroBackground";
import { getPersonalizedGreeting } from "@/utils/greetingUtils";
import { useIsMobile } from "@/hooks/use-mobile";
import { UserIntent, IntentDetails } from "@/types/intents";
import NicoleUnifiedInterface from "@/components/ai/unified/NicoleUnifiedInterface";

interface HeroProps {
  className?: string;
}

const localStorageService = new LocalStorageService();

const intentDetails: { [key in UserIntent]: IntentDetails } = {
  "auto-gift": {
    title: "Set up Auto-Gifting",
    description: "Never miss an occasion! Automatically send gifts to your loved ones on their special days.",
    icon: Gift,
  },
  "shop-solo": {
    title: "Find the Perfect Gift",
    description: "Explore our curated selection of unique gifts for every personality and occasion.",
    icon: Sparkles,
  },
  "create-wishlist": {
    title: "Create a Wishlist",
    description: "Let your friends and family know exactly what you're wishing for.",
    icon: Heart,
  },
};

const Hero: React.FC = () => {
  const [showCountdown, setShowCountdown] = useState(false);
  const [userIntent, setUserIntent] = useState<UserIntent | null>(null);
  const [isNicoleOpen, setIsNicoleOpen] = useState(false);
  const [selectedIntent, setSelectedIntent] = useState<"auto-gift" | "shop-solo" | "create-wishlist" | null>(null);
  const [showIntentModal, setShowIntentModal] = useState(false);
  const [nicoleContext, setNicoleContext] = useState<any>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { profile } = useProfile();

  useEffect(() => {
    const storedIntent = localStorageService.getItem("userIntent") as UserIntent | null;
    if (storedIntent) {
      setUserIntent(storedIntent);
    }

    const onboardingComplete = localStorageService.getItem("onboardingComplete") === "true";
    setShowCountdown(!onboardingComplete);

    const showingIntentModal = localStorageService.getItem("showingIntentModal") === "true";
    if (showingIntentModal && !storedIntent) {
      setShowIntentModal(true);
    }
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (heroRef.current && !heroRef.current.contains(event.target as Node)) {
        setIsNicoleOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const handleModalClose = () => {
    setShowIntentModal(false);
    localStorageService.setItem("showingIntentModal", "false");
  };

  const handleIntentSelect = (intent: UserIntent) => {
    setUserIntent(intent);
    localStorageService.setItem("userIntent", intent);
    localStorageService.setItem("showingIntentModal", "false");
    setShowIntentModal(false);

    if (intent === "giftor") {
      window.location.href = "/marketplace";
    } else if (intent === "giftee") {
      window.location.href = "/profile-setup";
    }
  };

  // Handle CTA clicks that should open Nicole
  const handleCTAClick = (intent: "auto-gift" | "shop-solo" | "create-wishlist") => {
    console.log(`Hero CTA clicked: ${intent}`);
    
    const greetingContext = getPersonalizedGreeting(user, profile);
    
    setSelectedIntent(intent);
    setNicoleContext({
      capability: intent === 'auto-gift' ? 'auto_gifting' : 'conversation',
      selectedIntent: intent,
      userFirstName: greetingContext.firstName,
      greetingContext
    });
    setIsNicoleOpen(true);
  };

  const handleNicoleClose = () => {
    setIsNicoleOpen(false);
    setSelectedIntent(null);
    setNicoleContext(null);
  };

  const handleIntentComplete = (intent: "auto-gift" | "shop-solo" | "create-wishlist") => {
    console.log(`Intent completed: ${intent}`);
    // Handle the completion logic here if needed
  };

  const getHeroTitle = () => {
    if (user) {
      return getPersonalizedGreeting(user, profile).fullGreeting;
    } else {
      return "Find the Perfect Gift for Every Occasion";
    }
  };

  const getHeroSubtitle = () => {
    if (user) {
      return "Let us help you find the perfect gift for your loved ones.";
    } else {
      return "Discover unique and thoughtful gifts for birthdays, holidays, and more.";
    }
  };

  return (
    <div ref={heroRef} className="relative min-h-screen flex flex-col">
      <HeroBackground />
      
      {/* Main Hero Content */}
      <div className="relative z-10 flex-1 flex flex-col justify-center">
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="font-sans text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
            {getHeroTitle()}
          </h1>
          <p className="text-lg md:text-xl lg:text-2xl text-white mb-8">
            {getHeroSubtitle()}
          </p>
          
          {/* Main CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto">
            <Button
              size="lg"
              className="w-full sm:w-auto text-lg px-8 py-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-none shadow-lg hover:shadow-xl transition-all duration-300"
              onClick={() => handleCTAClick('auto-gift')}
            >
              <Gift className="mr-2 h-5 w-5" />
              Start Auto-Gifting
            </Button>
            
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto text-lg px-8 py-6 border-2 border-purple-600 text-purple-600 hover:bg-purple-50 transition-all duration-300"
              onClick={() => handleCTAClick('shop-solo')}
            >
              <Sparkles className="mr-2 h-5 w-5" />
              Start Gifting
            </Button>
          </div>

          {showCountdown && (
            <div className="mt-12">
              <h2 className="text-2xl text-white font-semibold mb-4">
                Time Until the Next Special Occasion
              </h2>
              <div className="flex items-center justify-center">
                <Clock className="mr-2 h-5 w-5 text-white" />
                <p className="text-white">Don't miss out! Set up your auto-gifts now.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Intent Selection Modal */}
      <IntentSelectionModal
        isOpen={showIntentModal}
        onClose={handleModalClose}
        onIntentSelect={handleIntentSelect}
        userFirstName={getPersonalizedGreeting(user, profile).firstName}
      />

      {/* Nicole AI Interface */}
      <NicoleUnifiedInterface
        isOpen={isNicoleOpen}
        onClose={handleNicoleClose}
        initialContext={nicoleContext}
        entryPoint="hero"
        onIntentComplete={handleIntentComplete}
      />

      {/* Countdown Timer */}
      <CountdownTimer />
    </div>
  );
};

export default Hero;
