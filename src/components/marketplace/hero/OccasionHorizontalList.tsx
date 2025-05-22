
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
            // Use a slimmer look
            highlightColor={item.highlightColor}
          />
        </div>
      ))}
    </div>
  );
};

export default OccasionHorizontalList;
</lov_write>

<lov-write file_path="src/components/marketplace/header/OccasionListItem.tsx">
import React from "react";
import type { LucideIcon } from "lucide-react";

// Used for both friend occasions & holidays
interface OccasionListItemProps {
  date: Date;
  avatarUrl?: string;
  avatarAlt?: string;
  icon?: LucideIcon;
  title: string;
  subtitle?: string;
  highlightColor?: string;
  onClick?: () => void;
}

function getMonthAbbr(date: Date) {
  return date.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
}

export const OccasionListItem: React.FC<OccasionListItemProps> = ({
  date,
  avatarUrl,
  avatarAlt,
  icon,
  title,
  subtitle,
  highlightColor = "#D1D5DB",
  onClick
}) => {
  return (
    <button
      className={`
        flex items-center gap-3 w-full px-2 py-3 rounded-lg
        bg-white border border-gray-100 shadow-sm transition
        hover:bg-gray-50 focus:outline-none truncate
      `}
      style={{ cursor: onClick ? "pointer" : "default" }}
      type="button"
      onClick={onClick}
      tabIndex={0}
    >
      {/* Date badge */}
      <div className="flex flex-col items-center justify-center min-w-[42px]">
        <div
          className="rounded-lg flex flex-col items-center justify-center w-11 h-11 border-2"
          style={{
            borderColor: highlightColor,
            background: "#f6f5fe",
            color: "#2d246f"
          }}
        >
          <span className="text-[10px] font-semibold" style={{ color: highlightColor }}>
            {getMonthAbbr(date)}
          </span>
          <span className="text-base font-bold text-gray-900 leading-none">{date.getDate()}</span>
        </div>
      </div>

      {/* Avatar or icon */}
      <div className="flex-shrink-0 w-11 h-11 flex items-center justify-center relative">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={avatarAlt || ""}
            className="w-11 h-11 rounded-full object-cover border-2 border-white bg-gray-100"
          />
        ) : icon ? (
          <div
            className="w-11 h-11 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center"
          >
            {React.createElement(icon, { size: 24, color: "#8E9196" })}
          </div>
        ) : null}
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-grow text-left min-w-0">
        <span className="font-sans text-[14px] font-semibold text-gray-700 truncate">{title}</span>
        {subtitle && (
          <span className="text-xs text-gray-400 font-normal truncate">{subtitle}</span>
        )}
      </div>
    </button>
  );
};

export default OccasionListItem;
