
import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import { useNavigate } from "react-router-dom";
import { LocalStorageService } from "@/services/localStorage/LocalStorageService";
import ElyphantTextLogo from "@/components/ui/ElyphantTextLogo";

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
      <ElyphantTextLogo />
    </div>
  );
};

export default Logo;
