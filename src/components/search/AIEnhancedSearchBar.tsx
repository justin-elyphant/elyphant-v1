import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { NicoleUnifiedInterface } from "@/components/ai/unified/NicoleUnifiedInterface";

interface AIEnhancedSearchBarProps {
  onNavigateToResults?: (searchQuery: string) => void;
  className?: string;
  mobile?: boolean;
}

const AIEnhancedSearchBar: React.FC<AIEnhancedSearchBarProps> = ({ 
  onNavigateToResults, 
  className = "",
  mobile = false
}) => {
  const [query, setQuery] = useState("");
  const [isNicoleOpen, setIsNicoleOpen] = useState(false);
  const [nicoleContext, setNicoleContext] = useState<any>(null);
  const navigate = useNavigate();

  // Listen for global Nicole trigger events
  useEffect(() => {
    const handleTriggerNicole = (event: CustomEvent) => {
      const { capability, context } = event.detail;
      
      setNicoleContext({
        capability,
        ...context
      });
      setIsNicoleOpen(true);
      
      toast.success("Nicole is ready to help!", {
        description: "Ask me anything about finding the perfect gift"
      });
    };

    window.addEventListener('triggerNicole', handleTriggerNicole as EventListener);
    
    return () => {
      window.removeEventListener('triggerNicole', handleTriggerNicole as EventListener);
    };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      if (onNavigateToResults) {
        onNavigateToResults(query.trim());
      } else {
        navigate(`/marketplace?search=${encodeURIComponent(query.trim())}`);
      }
    }
  };

  const handleNicoleClick = () => {
    setNicoleContext({
      capability: 'search',
      conversationPhase: 'greeting'
    });
    setIsNicoleOpen(true);
    toast.success("Nicole is ready to help!", {
      description: "Ask me anything about finding the perfect gift"
    });
  };

  const handleNicoleClose = () => {
    setIsNicoleOpen(false);
    setNicoleContext(null);
  };

  const handleNicoleNavigate = (searchQuery: string) => {
    if (onNavigateToResults) {
      onNavigateToResults(searchQuery);
    } else {
      navigate(`/marketplace?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className={`relative w-full ${className}`}>
      {/* Enhanced Search Bar */}
      <form onSubmit={handleSearch} className="relative">
        <div className="relative flex items-center">
          <div className="absolute left-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-muted-foreground" />
          </div>
          
          <Input
            type="search"
            placeholder="Search products or ask Nicole for gift recommendations..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={`pl-10 pr-32 ${
              mobile 
                ? "text-base py-3 h-12 rounded-lg" 
                : "h-12 text-base"
            } border-2 border-border focus:border-primary transition-colors`}
          />
          
          <div className="absolute right-2 flex items-center space-x-2">
            {/* Nicole AI Button */}
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={handleNicoleClick}
              className="h-8 px-3 bg-gradient-to-r from-purple-100 to-pink-100 hover:from-purple-200 hover:to-pink-200 text-purple-700 border border-purple-200"
            >
              <Sparkles className="h-3 w-3 mr-1" />
              Ask Nicole
            </Button>
            
            {/* Search Button */}
            <Button 
              type="submit" 
              size="sm" 
              className="h-8 px-3 bg-primary hover:bg-primary/90"
            >
              <Search className="h-3 w-3" />
            </Button>
          </div>
        </div>
        
        {/* AI Enhancement Badge */}
        <div className="absolute -top-2 left-10">
          <Badge variant="secondary" className="text-xs bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border-purple-200">
            <Sparkles className="h-2.5 w-2.5 mr-1" />
            AI Enhanced
          </Badge>
        </div>
      </form>

      {/* Nicole AI Interface */}
      <NicoleUnifiedInterface
        isOpen={isNicoleOpen}
        onClose={handleNicoleClose}
        onNavigateToResults={handleNicoleNavigate}
        initialContext={nicoleContext}
        className="mt-2"
      />

      {/* Quick Examples */}
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setQuery("birthday gifts")}
          className="h-7 text-xs"
        >
          Birthday gifts
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setQuery("tech gadgets")}
          className="h-7 text-xs"
        >
          Tech gadgets
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleNicoleClick}
          className="h-7 text-xs bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 border-purple-200"
        >
          <Sparkles className="h-2.5 w-2.5 mr-1" />
          Ask Nicole for ideas
        </Button>
      </div>
    </div>
  );
};

export default AIEnhancedSearchBar;
