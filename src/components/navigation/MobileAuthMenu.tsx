import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

const MobileAuthMenu = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleSignIn = () => {
    navigate("/auth?mode=signin");
    setOpen(false);
  };

  const handleGetStarted = () => {
    navigate("/auth?mode=signup&redirect=/gifting");
    setOpen(false);
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button variant="ghost" size="sm" className="p-2">
          <Menu className="h-5 w-5" />
        </Button>
      </DrawerTrigger>
      <DrawerContent className="border-0 bg-background">
        <DrawerHeader className="pb-4">
          <DrawerTitle className="text-lg font-semibold">Account</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-6 space-y-3">
          <Button 
            variant="ghost" 
            size="lg"
            onClick={handleSignIn}
            className="w-full text-foreground hover:text-foreground h-12"
          >
            Sign In
          </Button>
          <Button
            size="lg"
            onClick={handleGetStarted}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12"
          >
            Get Started
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default MobileAuthMenu;