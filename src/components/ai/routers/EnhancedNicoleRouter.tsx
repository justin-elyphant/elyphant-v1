import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LocalStorageService } from "@/services/localStorage/LocalStorageService";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Sparkles } from "lucide-react";

interface NicoleContextData {
  currentPage: string;
  searchQuery?: string;
  userIntent?: string;
  timestamp: string;
  previousActions?: string[];
  timeSpentOnPage?: number;
}

interface EnhancedNicoleRouterProps {
  trigger?: React.ReactNode;
  context?: Partial<NicoleContextData>;
  onIntentSelected?: (intent: string) => void;
  className?: string;
}

const INTENT_OPTIONS = [
  { value: "giftor", label: "I want to give gifts", description: "Find perfect gifts for others" },
  { value: "giftee", label: "I want to receive gifts", description: "Share your wishlist preferences" },
  { value: "group-gifting", label: "Organize group gifts", description: "Coordinate gifts with others" },
  { value: "auto-gifting", label: "Automate my gifting", description: "Set up automatic gift giving" },
];

/**
 * Enhanced Nicole Router with responsive design
 * Desktop: Dropdown menu
 * Mobile: Modal dialog
 */
const EnhancedNicoleRouter: React.FC<EnhancedNicoleRouterProps> = ({
  trigger,
  context = {},
  onIntentSelected,
  className = "",
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [pageStartTime] = useState(Date.now());

  // Detect screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const handleIntentSelection = (intent: string) => {
    const timeSpentOnPage = Date.now() - pageStartTime;
    
    // Store enhanced context in LocalStorageService
    LocalStorageService.setNicoleContext({
      source: location.pathname,
      selectedIntent: intent,
      currentPage: location.pathname,
      searchQuery: context.searchQuery,
      userIntent: intent,
      timestamp: new Date().toISOString(),
      previousActions: context.previousActions,
      timeSpentOnPage,
    });

    // Close the interface
    setIsOpen(false);
    
    // Callback for parent component
    onIntentSelected?.(intent);
    
    // Navigate to marketplace with Nicole mode and intent
    navigate(`/marketplace?mode=nicole&open=true&intent=${intent}`);
  };

  const defaultTrigger = (
    <Button
      variant="outline"
      className={`gap-2 ${className}`}
      onClick={() => setIsOpen(true)}
    >
      <Sparkles className="h-4 w-4" />
      Ask Nicole AI
      {!isMobile && <ChevronDown className="h-4 w-4" />}
    </Button>
  );

  const triggerElement = trigger || defaultTrigger;

  // Mobile: Modal Dialog
  if (isMobile) {
    return (
      <>
        <div onClick={() => setIsOpen(true)}>
          {triggerElement}
        </div>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                How can Nicole help you today?
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-3">
              {INTENT_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  variant="outline"
                  className="w-full text-left justify-start h-auto p-4"
                  onClick={() => handleIntentSelection(option.value)}
                >
                  <div>
                    <div className="font-medium">{option.label}</div>
                    <div className="text-sm text-muted-foreground">
                      {option.description}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Desktop: Dropdown Menu
  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        {triggerElement}
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80">
        {INTENT_OPTIONS.map((option) => (
          <DropdownMenuItem
            key={option.value}
            className="p-4 cursor-pointer"
            onClick={() => handleIntentSelection(option.value)}
          >
            <div>
              <div className="font-medium">{option.label}</div>
              <div className="text-sm text-muted-foreground">
                {option.description}
              </div>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default EnhancedNicoleRouter;