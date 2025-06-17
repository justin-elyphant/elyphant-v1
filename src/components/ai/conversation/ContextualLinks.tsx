
import React from "react";
import { Button } from "@/components/ui/button";
import { ExternalLink, Calendar, Heart, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ContextualLink } from "@/services/ai/nicoleAiService";

interface ContextualLinksProps {
  links: ContextualLink[];
  className?: string;
}

const ContextualLinks: React.FC<ContextualLinksProps> = ({ links, className = "" }) => {
  const navigate = useNavigate();

  if (!links || links.length === 0) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'wishlist':
        return <Heart className="h-3 w-3" />;
      case 'schedule':
        return <Calendar className="h-3 w-3" />;
      case 'connections':
        return <Users className="h-3 w-3" />;
      default:
        return <ExternalLink className="h-3 w-3" />;
    }
  };

  const handleLinkClick = (url: string) => {
    navigate(url);
  };

  return (
    <div className={`flex flex-col gap-2 mt-3 ${className}`}>
      {links.map((link, index) => (
        <Button
          key={index}
          variant="outline"
          size="sm"
          className="flex items-center gap-2 h-auto py-2 px-3 text-xs justify-start bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-700"
          onClick={() => handleLinkClick(link.url)}
        >
          {getIcon(link.type)}
          <span className="text-left">{link.text}</span>
        </Button>
      ))}
    </div>
  );
};

export default ContextualLinks;
