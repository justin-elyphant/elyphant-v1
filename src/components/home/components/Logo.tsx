
import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import { useNavigate } from "react-router-dom";
import { LocalStorageService } from "@/services/localStorage/LocalStorageService";

const Logo = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleLogoClick = () => {
    // Navigate to homepage with fresh context
    LocalStorageService.setNicoleContext({ 
      source: 'logo_click',
      currentPage: '/',
      timestamp: new Date().toISOString()
    });
    
    // Clean up deprecated keys
    LocalStorageService.cleanupDeprecatedKeys();
    
    console.log("Logo clicked, navigating to homepage");
    navigate("/");
  };

  return (
    <div onClick={handleLogoClick} className="cursor-pointer">
      <img 
        src="/lovable-uploads/12c8902c-9c47-4b7f-8861-6cfd13ec628b.png" 
        alt="Elyphant" 
        className="h-28 w-auto" 
      />
    </div>
  );
};

export default Logo;
