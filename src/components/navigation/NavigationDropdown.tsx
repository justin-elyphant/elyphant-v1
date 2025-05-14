
import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export interface NavDropdownItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
}

interface NavigationDropdownProps {
  label: string;
  items: NavDropdownItem[];
  triggerClassName?: string;
  contentClassName?: string;
  itemClassName?: string;
  variant?: "default" | "outline" | "ghost";
}

const NavigationDropdown: React.FC<NavigationDropdownProps> = ({
  label,
  items,
  triggerClassName,
  contentClassName,
  itemClassName,
  variant = "ghost"
}) => {
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant={variant} 
          className={cn("flex items-center gap-1", triggerClassName)}
        >
          {label}
          <ChevronDown 
            className={cn(
              "h-4 w-4 transition-transform", 
              open ? "rotate-180" : ""
            )} 
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="start" 
        className={cn("w-56 bg-background border shadow-md", contentClassName)}
      >
        {items.map((item, index) => (
          <DropdownMenuItem key={index} asChild className={cn("cursor-pointer", itemClassName)}>
            <Link to={item.href} className="flex w-full items-center">
              {item.icon && <span className="mr-2">{item.icon}</span>}
              {item.label}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NavigationDropdown;
