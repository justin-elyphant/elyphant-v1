
import { ReactElement } from "react";
import Home from "./pages/Home";
import TestZincOrder from "./pages/TestZincOrder";
import AdminAmazonCredentials from "./pages/AdminAmazonCredentials";
import Marketplace from "./pages/Marketplace";
import Dashboard from "./pages/Dashboard";
import Connections from "./pages/Connections";

export interface NavItem {
  to: string;
  page: ReactElement;
}

export const navItems: NavItem[] = [
  { to: "/", page: <Home /> },
  { to: "/marketplace", page: <Marketplace /> },
  { to: "/dashboard", page: <Dashboard /> },
  { to: "/connections", page: <Connections /> },
  { to: "/admin/amazon-credentials", page: <AdminAmazonCredentials /> },
];
