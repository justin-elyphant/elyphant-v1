
import { ReactElement } from "react";
import Home from "./pages/Home";
import TestZincOrder from "./pages/TestZincOrder";
import AdminAmazonCredentials from "./pages/AdminAmazonCredentials";
import Marketplace from "./pages/Marketplace";

export interface NavItem {
  to: string;
  page: ReactElement;
}

export const navItems: NavItem[] = [
  { to: "/", page: <Home /> },
  { to: "/marketplace", page: <Marketplace /> },
  { to: "/admin/amazon-credentials", page: <AdminAmazonCredentials /> },
];
