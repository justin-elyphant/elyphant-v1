
export const HEADER_STYLES = {
  // Main header container
  header: "sticky top-0 z-50 bg-white border-b",
  
  // Navigation bar container
  navBar: "container mx-auto px-4 h-16 flex items-center justify-between",
  
  // Logo section
  logoSection: "flex items-center",
  logoImage: "h-20 w-20 mr-3",
  logoText: "text-3xl font-bold",
  
  // Desktop search section
  desktopSearch: "hidden md:flex flex-1 max-w-xl mx-8",
  
  // Desktop actions section
  desktopActions: "hidden md:flex items-center space-x-4",
  
  // Mobile actions section
  mobileActions: "flex md:hidden items-center space-x-3",
  
  // Shopping cart button
  cartButton: "relative",
  cartIcon: "h-6 w-6",
  cartBadge: "absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center",
  
  // Hamburger menu button
  hamburgerButton: "p-2",
  hamburgerIcon: "h-6 w-6",
  
  // Mobile menu
  mobileMenu: "md:hidden border-t bg-background"
} as const;
