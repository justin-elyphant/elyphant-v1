
import { ReactElement } from "react";
import Home from "./pages/Home";
import TestZincOrder from "./pages/TestZincOrder";
import AdminAmazonCredentials from "./pages/AdminAmazonCredentials";
import Marketplace from "./pages/Marketplace";
import Dashboard from "./pages/Dashboard";
import Connections from "./pages/Connections";
import Profile from "./pages/Profile";
import Wishlists from "./pages/Wishlists";
import Orders from "./pages/Orders";
import Settings from "./pages/Settings";
import Payments from "./pages/Payments";

export interface NavItem {
  to: string;
  page: ReactElement;
}

export const navItems: NavItem[] = [
  { to: "/", page: <Home /> },
  { to: "/marketplace", page: <Marketplace /> },
  { to: "/dashboard", page: <Dashboard /> },
  { to: "/connections", page: <Connections /> },
  { to: "/wishlists", page: <Wishlists /> },
  { to: "/orders", page: <Orders /> },
  { to: "/settings", page: <Settings /> },
  { to: "/payments", page: <Payments /> },
  { to: "/profile/:identifier", page: <Profile /> },
  { to: "/admin/amazon-credentials", page: <AdminAmazonCredentials /> },
];
