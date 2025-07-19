import { ReactElement } from "react";
import Index from "./pages/Index";
import TestZincOrder from "./pages/TestZincOrder";
import AdminAmazonCredentials from "./pages/AdminAmazonCredentials";

export interface NavItem {
  to: string;
  page: ReactElement;
}

export const navItems: NavItem[] = [
  { to: "/", page: <Index /> },
  { to: "/admin/amazon-credentials", page: <AdminAmazonCredentials /> },
];