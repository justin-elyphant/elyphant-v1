import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { cn } from "@/lib/utils";

interface SubCategoryTabsProps {
  className?: string;
}

const SubCategoryTabs: React.FC<SubCategoryTabsProps> = ({ className }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const currentCategory = searchParams.get('category') || 'all';

  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'giftsForHer', label: 'For Her' },
    { id: 'giftsForHim', label: 'For Him' },
    { id: 'giftsUnder50', label: 'Under $50' },
    { id: 'luxury', label: 'Trending' },
  ];

  const handleTabClick = (tabId: string) => {
    if (tabId === 'all') {
      navigate('/marketplace');
    } else {
      navigate(`/marketplace?${tabId}=true`);
    }
  };

  return (
    <div className={cn("flex items-center gap-6 border-b border-border overflow-x-auto scrollbar-hide pb-2", className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => handleTabClick(tab.id)}
          className={cn(
            "whitespace-nowrap text-sm font-medium pb-2 border-b-2 transition-colors min-h-[44px] touch-target-44",
            currentCategory === tab.id || (tab.id === 'all' && !currentCategory)
              ? "border-foreground text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default SubCategoryTabs;
