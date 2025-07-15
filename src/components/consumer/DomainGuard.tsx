import React from "react";
import { useAuth } from "@/contexts/auth";
import { Navigate } from "react-router-dom";

interface DomainGuardProps {
  children: React.ReactNode;
  requiredDomain?: string;
}

export function DomainGuard({ children, requiredDomain = "elyphant.com" }: DomainGuardProps) {
  const { user } = useAuth();

  // Check if user email has required domain
  const hasRequiredDomain = user?.email?.endsWith(`@${requiredDomain}`);

  if (!hasRequiredDomain) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}