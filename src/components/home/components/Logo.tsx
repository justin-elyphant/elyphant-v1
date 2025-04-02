
import React from "react";
import { Link } from "react-router-dom";

const Logo = () => {
  return (
    <Link to="/" className="flex items-center">
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
