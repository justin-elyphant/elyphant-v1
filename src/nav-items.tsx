
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
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import OrderDetail from "./pages/OrderDetail";
import Messages from "./pages/Messages";
import Chat from "./pages/Chat";

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
  { to: "/cart", page: <Cart /> },
  { to: "/checkout", page: <Checkout /> },
  { to: "/messages", page: <Messages /> },
  { to: "/messages/:userId", page: <Chat /> },
  { to: "/profile/:identifier", page: <Profile /> },
  { to: "/order/:orderId", page: <OrderDetail /> },
  { to: "/order-confirmation/:orderId", page: <OrderConfirmation /> },
  { to: "/admin/amazon-credentials", page: <AdminAmazonCredentials /> },
];
