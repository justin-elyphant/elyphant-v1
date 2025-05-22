
import React from "react";
import OccasionListItem from "../header/OccasionListItem";

interface OccasionListType {
  date: Date;
  avatarUrl?: string;
  avatarAlt?: string;
  icon?: any;
  title: string;
  subtitle?: string;
  highlightColor?: string;
  onClick?: () => void;
}

interface OccasionHorizontalListProps {
  occasions: OccasionListType[];
  emptyMessage?: string;
}

const OccasionHorizontalList: React.FC<OccasionHorizontalListProps> = ({
  occasions,
  emptyMessage,
}) => {
  if (!occasions.length) {
    return (
      <div className="text-gray-500 text-sm text-center py-8">{emptyMessage}</div>
    );
  }

  return (
    <div className="flex flex-row gap-2 md:gap-4 overflow-x-auto scrollbar-none px-1" style={{ WebkitOverflowScrolling: "touch" }}>
      {occasions.map((item, idx) => (
        <div key={idx} className="min-w-[230px] max-w-[260px]">
          <OccasionListItem
            {...item}
            highlightColor={item.highlightColor}
          />
        </div>
      ))}
    </div>
  );
};

export default OccasionHorizontalList;
