export interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon?: React.ReactNode;
  badge?: number;
  hasUnread?: boolean;
  requiresAuth?: boolean;
  section?: 'primary' | 'secondary' | 'account' | 'support';
}

export interface NavigationSection {
  id: string;
  title: string;
  icon?: React.ReactNode;
  items: NavigationItem[];
}

export interface NavigationConfig {
  sections: NavigationSection[];
  quickActions: NavigationItem[];
}