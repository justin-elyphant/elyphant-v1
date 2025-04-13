
import React from "react";
import { Link, useNavigate } from "react-router-dom";

const Logo = () => {
  const navigate = useNavigate();

  const handleLogoClick = () => {
    // Clean up any profile setup flags when navigating away
    localStorage.removeItem("newSignUp");
    localStorage.removeItem("userEmail");
    console.log("Logo clicked, navigating to home page");
  };

  return (
    <Link to="/" className="flex items-center" onClick={handleLogoClick}>
      <img 
        src="/lovable-uploads/f2de31b2-3028-48b8-b4ce-22ed58bbcf81.png" 
        alt="Elyphant" 
        className="h-16 w-16 mr-2" 
      />
      <h1 className="text-2xl font-bold">Elyphant</h1>
    </Link>
  );
};

export default Logo;
