import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Card, CardContent } from '@/components/ui/card';
import { MessageCircle, Gift, List, ShoppingBag, Calendar, Users, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EnhancedNicoleRouterProps {
  triggerElement?: React.ReactNode;
  source?: 'header' | 'marketplace' | 'dashboard' | 'signup';
  context?: {
    currentPage?: string;
    userIntent?: string;
    searchQuery?: string;
  };
}

interface IntentOption {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  route: string;
  color: string;
  hoverColor: string;
}

const EnhancedNicoleRouter: React.FC<EnhancedNicoleRouterProps> = ({
  triggerElement,
  source = 'header',
  context = {}
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const intentOptions: IntentOption[] = [
    {
      id: 'find-gifts',
      title: 'Find Perfect Gifts',
      description: 'Get personalized gift recommendations with AI assistance',
      icon: <Gift className="w-6 h-6" />,
      route: '/marketplace?mode=nicole&open=true&greeting=gift-finder',
      color: 'text-purple-600',
      hoverColor: 'hover:bg-purple-50'
    },
    {
      id: 'build-wishlists',
      title: 'Build Wishlists',
      description: 'Create and manage your gift wishlists',
      icon: <List className="w-6 h-6" />,
      route: '/marketplace?mode=wishlist&source=nicole',
      color: 'text-blue-600',
      hoverColor: 'hover:bg-blue-50'
    },
    {
      id: 'browse-marketplace',
      title: 'Browse Marketplace',
      description: 'Explore products with intelligent search',
      icon: <ShoppingBag className="w-6 h-6" />,
      route: '/marketplace?mode=browse&source=nicole',
      color: 'text-green-600',
      hoverColor: 'hover:bg-green-50'
    },
    {
      id: 'manage-events',
      title: 'Manage Events',
      description: 'Set up automated gifting for special occasions',
      icon: <Calendar className="w-6 h-6" />,
      route: '/events?source=nicole',
      color: 'text-orange-600',
      hoverColor: 'hover:bg-orange-50'
    },
    {
      id: 'connect-friends',
      title: 'Connect with Friends',
      description: 'Share wishlists and coordinate group gifts',
      icon: <Users className="w-6 h-6" />,
      route: '/connections?source=nicole',
      color: 'text-indigo-600',
      hoverColor: 'hover:bg-indigo-50'
    },
    {
      id: 'surprise-me',
      title: 'Surprise Me!',
      description: 'Let Nicole suggest something amazing based on trends',
      icon: <Sparkles className="w-6 h-6" />,
      route: '/marketplace?mode=nicole&open=true&greeting=surprise&context=trending',
      color: 'text-pink-600',
      hoverColor: 'hover:bg-pink-50'
    }
  ];

  const handleIntentSelection = (intent: IntentOption) => {
    // Use the centralized localStorage service for Nicole context
    import('@/services/localStorage/LocalStorageService').then(({ LocalStorageService }) => {
      LocalStorageService.setNicoleContext({
        source,
        selectedIntent: intent.id,
        currentPage: window.location.pathname,
        ...context
      });
    });

    // Close modal/dropdown
    setIsOpen(false);

    // Navigate with enhanced context
    navigate(intent.route, { replace: false });
  };

  const defaultTrigger = (
    <Button
      variant="outline"
      size="sm"
      className="bg-muted border-border hover:border-muted-foreground text-foreground"
    >
      <MessageCircle className="w-4 h-4 mr-2" />
      Ask Nicole
    </Button>
  );

  const IntentGrid = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {intentOptions.map((intent) => (
        <Button
          key={intent.id}
          variant="outline"
          className={cn(
            "flex items-start gap-3 p-4 h-auto text-left justify-start",
            intent.hoverColor,
            "border-2 hover:border-opacity-50 transition-all duration-200"
          )}
          onClick={() => handleIntentSelection(intent)}
        >
          <div className={cn("flex-shrink-0 mt-0.5", intent.color)}>
            {intent.icon}
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-foreground mb-1">
              {intent.title}
            </span>
            <span className="text-sm text-muted-foreground text-left">
              {intent.description}
            </span>
          </div>
        </Button>
      ))}
    </div>
  );

  // Desktop: Dropdown Menu
  if (!isMobile) {
    return (
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          {triggerElement || defaultTrigger}
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[600px] p-6" align="center">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-center mb-2">
              Hi{user?.user_metadata?.first_name ? ` ${user.user_metadata.first_name}` : ''}! What can Nicole help you with?
            </h3>
            <p className="text-sm text-muted-foreground text-center">
              Choose an option below to get started with personalized assistance
            </p>
          </div>
          <IntentGrid />
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Mobile: Modal Dialog
  return (
    <>
      <div onClick={() => setIsOpen(true)}>
        {triggerElement || defaultTrigger}
      </div>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md max-w-[90vw] p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl text-center">
              Hi{user?.user_metadata?.first_name ? ` ${user.user_metadata.first_name}` : ''}! What can Nicole help you with?
            </DialogTitle>
            <p className="text-sm text-muted-foreground text-center">
              Choose an option below to get started with personalized assistance
            </p>
          </DialogHeader>
          <IntentGrid />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EnhancedNicoleRouter;