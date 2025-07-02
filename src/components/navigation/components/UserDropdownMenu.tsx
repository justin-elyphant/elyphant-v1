
import React from "react";
import UserButton from "@/components/auth/UserButton";
import { User } from "@supabase/supabase-js";

interface NavDropdownItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

interface UserDropdownMenuProps {
  user?: User;
  profile?: { name?: string; profile_image?: string };
  email?: string;
  onSignOut: () => void;
  marketplaceItems?: NavDropdownItem[];
  connectionsItems?: NavDropdownItem[];
}

const UserDropdownMenu = ({ 
  user, 
  profile, 
  email, 
  onSignOut,
  marketplaceItems,
  connectionsItems 
}: UserDropdownMenuProps) => {
  // Simply use the consolidated UserButton component
  return <UserButton />;
};

export default UserDropdownMenu;
