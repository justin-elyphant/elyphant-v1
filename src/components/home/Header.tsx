
import React, { useState } from "react";
import Logo from "./components/Logo";
import SearchBar from "./components/SearchBar";
import CategoriesDropdown from "./components/CategoriesDropdown";
import AuthButtons from "./components/AuthButtons";

const Header = () => {
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  
  return (
    <header className="bg-white shadow-sm sticky top-0 z-40">
      <div className="container mx-auto py-4 px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-3">
          <div className="flex items-center">
            <Logo />
          </div>
          
          <div className="flex items-center space-x-3">
            <CategoriesDropdown 
              open={isCategoriesOpen} 
              onOpenChange={setIsCategoriesOpen} 
            />
          </div>
          
          <SearchBar />
          
          <AuthButtons />
        </div>
      </div>
    </header>
  );
};

export default Header;
