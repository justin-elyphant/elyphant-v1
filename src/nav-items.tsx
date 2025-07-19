import { ReactElement } from "react";
import TestZincOrder from "./pages/TestZincOrder";

export interface NavItem {
  to: string;
  page: ReactElement;
}

export const navItems: NavItem[] = [
  // Add your page routes here as needed
  // Example: { to: "/", page: <HomePage /> },
];