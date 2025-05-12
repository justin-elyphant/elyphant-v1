import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import { Button } from "@/components/ui/button";
import Logo from "../home/components/Logo";
import UserButton from "../auth/UserButton";
import NotificationsDropdown from "../notifications/NotificationsDropdown";

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const { user, signOut } = useAuth();
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b bg-white">
        <div className="container flex items-center justify-between h-16">
          <Link to="/" className="flex items-center">
            <Logo />
          </Link>
          
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            <Link to="/dashboard" className="hover:text-gray-600 transition-colors">
              Dashboard
            </Link>
            <Link to="/connections" className="hover:text-gray-600 transition-colors">
              Connections
            </Link>
            <Link to="/profile-setup" className="hover:text-gray-600 transition-colors">
              Profile
            </Link>
            <Link to="/wishlists" className="hover:text-gray-600 transition-colors">
              Wishlists
            </Link>
          </nav>
          
          <div className="flex items-center space-x-1">
            {/* Add the notifications dropdown before any other header items */}
            <NotificationsDropdown />
            {user ? (
              <UserButton />
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/login">Log In</Link>
                </Button>
                <Button asChild>
                  <Link to="/signup">Sign Up</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>
      
      <main className="flex-1 container py-6">{children}</main>
      
      <footer className="py-8 text-center text-sm text-muted-foreground">
        <p>
          &copy; {new Date().getFullYear()} Gift Giver. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default MainLayout;
