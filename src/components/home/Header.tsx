import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Menu, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import Logo from "./components/Logo";
import AuthButtons from "./components/AuthButtons";
import SearchBar from "./components/SearchBar";
import UserButton from "@/components/auth/UserButton";
import CategoriesDropdown from "./components/CategoriesDropdown";
import { ProductProvider } from "@/contexts/ProductContext";

const Header = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  
  return (
    <header className="sticky top-0 bg-white shadow-sm z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/">
              <Logo />
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <ProductProvider>
              <CategoriesDropdown 
                open={categoriesOpen}
                onOpenChange={setCategoriesOpen}
              />
            </ProductProvider>
            
            {/* Add Marketplace Link */}
            <Button
              variant="ghost"
              onClick={() => navigate("/marketplace")}
              className="text-sm font-medium"
            >
              Marketplace
            </Button>
            
            <SearchBar />
            
            {user ? (
              <UserButton />
            ) : (
              <AuthButtons />
            )}
          </div>
          
          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden flex items-center"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
        
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 py-4 border-t">
            <div className="flex mb-4">
              <Input 
                placeholder="Search for gifts..."
                className="flex-grow mr-2"
              />
              <Button 
                size="icon"
                variant="ghost"
                onClick={() => {/* search logic */}}
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-3">
              <ProductProvider>
                <CategoriesDropdown 
                  open={categoriesOpen}
                  onOpenChange={setCategoriesOpen}
                />
              </ProductProvider>
              
              <Button 
                variant="ghost" 
                className="w-full justify-start" 
                onClick={() => navigate("/marketplace")}
              >
                Marketplace
              </Button>
              
              <Button 
                variant="ghost" 
                className="w-full justify-start" 
                onClick={() => navigate("/wishlists")}
              >
                Wishlists
              </Button>
              
              {/* Auth buttons for mobile */}
              {!user && (
                <div className="flex flex-col gap-2 pt-3 border-t">
                  <Button 
                    variant="purple"
                    className="w-full" 
                    onClick={() => navigate("/signup")}
                  >
                    Sign Up
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={() => navigate("/login")}
                  >
                    Log In
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
