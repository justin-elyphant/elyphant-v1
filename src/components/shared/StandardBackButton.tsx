
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StandardBackButtonProps {
  to?: string;
  onClick?: () => void;
  text?: string;
  className?: string;
}

const StandardBackButton = ({ 
  to, 
  onClick, 
  text = "Back", 
  className = "" 
}: StandardBackButtonProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (to) {
      navigate(to);
    } else {
      navigate(-1);
    }
  };

  if (to && !onClick) {
    return (
      <div className={`mb-6 ${className}`}>
        <Button variant="outline" size="sm" asChild>
          <Link to={to} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            {text}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className={`mb-6 ${className}`}>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleClick}
        className="flex items-center gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        {text}
      </Button>
    </div>
  );
};

export default StandardBackButton;
