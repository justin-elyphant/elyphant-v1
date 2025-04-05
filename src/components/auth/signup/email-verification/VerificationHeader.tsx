
import React from "react";
import {
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

interface VerificationHeaderProps {
  userEmail: string | null;
}

const VerificationHeader = ({ userEmail }: VerificationHeaderProps) => {
  return (
    <div className="flex items-center gap-3 mb-2">
      <span className="text-4xl">🐘</span>
      <div>
        <CardTitle className="text-2xl font-bold">Welcome to Elyphant!</CardTitle>
        <CardDescription className="text-base">
          We've sent a verification link to {userEmail}
        </CardDescription>
      </div>
    </div>
  );
};

export default VerificationHeader;
