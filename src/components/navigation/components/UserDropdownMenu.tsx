
import React from "react";
import UserButton from "@/components/auth/UserButton";

interface UserDropdownMenuProps {
  profile?: { name?: string; profile_image?: string };
  email?: string;
  onSignOut: () => void;
}

const UserDropdownMenu = ({ profile, email, onSignOut }: UserDropdownMenuProps) => {
  // Simply use the consolidated UserButton component
  return <UserButton />;
};

export default UserDropdownMenu;
